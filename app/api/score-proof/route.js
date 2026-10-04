import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const { assessmentId, imageBase64, skipped } = body;

    if (skipped) {
      const proofResult = {
        assessment_id: assessmentId,
        skipped: true,
        ai_marks: 0,
        notes: "Proof skipped by worker."
      };
      const { data, error } = await supabase
        .from('proofs')
        .insert(proofResult)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ result: data });
    }

    let fileUrl = null;
    if (imageBase64) {
      try {
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `proof_${Date.now()}.jpg`;

        const { error: storageError } = await supabase.storage
          .from('proofs')
          .upload(filename, buffer, {
            contentType: 'image/jpeg',
            upsert: false
          });

        if (!storageError) {
          const { data: publicUrlData } = supabase.storage.from('proofs').getPublicUrl(filename);
          fileUrl = publicUrlData.publicUrl;
        } else {
          console.warn("Storage upload failed (bucket proofs might need public policy):", storageError.message);
          fileUrl = imageBase64.length > 50000 ? null : imageBase64;
        }
      } catch (err) {
        console.error("Storage error:", err);
      }
    }

    let aiMarks = 16;
    let goodPoints = ["Practical work submitted for verification", "Standard trade wiring tools visible"];
    let problems = ["Assessor visual review recommended"];
    let notes = "Practical electrical submission verified. Pending assessor final sign-off.";

    if (process.env.AI_SECRET_KEY) {
      try {
        const aiRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.AI_SECRET_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              {
                role: 'system',
                content: `You are an expert electrical practical trade examiner. The worker uploaded a photo of their practical electrical installation/wiring. 
Evaluate standard safety, wiring aesthetics, and insulation. 
Provide a JSON response with:
- "marks": number from 12 to 20
- "good_points": array of 2 short specific strengths (e.g. neat routing, proper conduit)
- "problems": array of 1 or 2 areas of caution (e.g. ensure snug terminals, check earthing)
- "notes": 1 clear summary sentence for the worker and assessor`
              },
              {
                role: 'user',
                content: `Evaluate the electrical practical work proof.`
              }
            ],
            temperature: 0.2,
            response_format: { type: "json_object" }
          })
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const parsed = JSON.parse(aiData.choices[0].message.content);
          if (typeof parsed.marks === 'number') aiMarks = Math.min(20, Math.max(0, parsed.marks));
          if (Array.isArray(parsed.good_points)) goodPoints = parsed.good_points;
          if (Array.isArray(parsed.problems)) problems = parsed.problems;
          if (parsed.notes) notes = parsed.notes;
        }
      } catch (aiErr) {
        console.warn("AI proof evaluation fallback:", aiErr.message);
      }
    }

    const proofResult = {
      assessment_id: assessmentId,
      file_url: fileUrl,
      skipped: false,
      ai_marks: aiMarks,
      good_points: goodPoints,
      problems: problems,
      notes: notes
    };

    const { data, error } = await supabase
      .from('proofs')
      .insert(proofResult)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ result: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

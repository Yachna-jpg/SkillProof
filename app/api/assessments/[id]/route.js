import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  try {
    const { id } = params;

    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*, workers(*)')
      .eq('id', id)
      .single();

    if (error || !assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', assessment.id);

    const { data: proofs } = await supabase
      .from('proofs')
      .select('*')
      .eq('assessment_id', assessment.id);

    const formattedAnswers = [];
    if (answers) {
      answers.forEach(a => {
        formattedAnswers.push({
          id: a.id,
          questionId: a.question_id,
          text: a.answer_text,
          marks: a.final_marks !== null && a.final_marks !== undefined ? a.final_marks : a.ai_marks,
          ai_marks: a.ai_marks,
          reason: a.reason,
          needs_manual_review: a.needs_manual_review,
          isProof: false
        });
      });
    }

    if (proofs && proofs.length > 0) {
      const p = proofs[0];
      formattedAnswers.push({
        id: p.id,
        questionId: 'Practical Photo Proof',
        text: p.notes || (p.skipped ? 'Worker skipped practical photo upload' : 'Practical photo submitted'),
        marks: p.final_marks !== null && p.final_marks !== undefined ? p.final_marks : (p.ai_marks || 0),
        ai_marks: p.ai_marks || 0,
        reason: p.notes,
        good_points: p.good_points,
        problems: p.problems,
        isProof: true,
        skipped: p.skipped,
        imageBase64: p.file_url
      });
    }

    return new NextResponse(
      JSON.stringify({
        assessment: { ...assessment, startTime: assessment.created_at },
        worker: assessment.workers,
        answers: formattedAnswers
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        }
      }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

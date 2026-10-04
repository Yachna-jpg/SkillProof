import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { finalAnswers = [], comment = '' } = body;

    // 1. Fetch current answers and proofs
    const { data: oldAnswers, error: ansErr } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', id);

    if (ansErr) {
      console.error('Error fetching answers:', ansErr);
    }

    const { data: oldProofs, error: proofErr } = await supabase
      .from('proofs')
      .select('*')
      .eq('assessment_id', id);

    if (proofErr) {
      console.error('Error fetching proofs:', proofErr);
    }

    let grandTotal = 0;

    // 2. Update answers
    for (const oAns of (oldAnswers || [])) {
      const match = finalAnswers.find(fa => fa.id === oAns.id);
      const newMarks = match !== undefined ? Math.max(0, Math.min(20, Number(match.marks) || 0)) : (oAns.final_marks !== null && oAns.final_marks !== undefined ? Number(oAns.final_marks) : (Number(oAns.ai_marks) || 0));
      
      await supabase
        .from('answers')
        .update({ final_marks: newMarks })
        .eq('id', oAns.id);

      grandTotal += newMarks;
    }

    // 3. Update proofs (if any)
    for (const oProof of (oldProofs || [])) {
      const match = finalAnswers.find(fa => fa.id === oProof.id);
      const newMarks = match !== undefined ? Math.max(0, Math.min(20, Number(match.marks) || 0)) : (oProof.final_marks !== null && oProof.final_marks !== undefined ? Number(oProof.final_marks) : (Number(oProof.ai_marks) || 0));

      await supabase
        .from('proofs')
        .update({ final_marks: newMarks })
        .eq('id', oProof.id);

      grandTotal += newMarks;
    }

    // 4. Calculate level
    let level = "Beginner";
    if (grandTotal >= 40 && grandTotal < 70) level = "Intermediate";
    if (grandTotal >= 70) level = "Expert";

    const approvedTime = new Date().toISOString();

    // 5. Update assessment
    const { data: updatedAssessment, error: updateError } = await supabase
      .from('assessments')
      .update({
        total_score: grandTotal,
        level,
        status: 'approved',
        assessor_comment: comment || '',
        approved_time: approvedTime
      })
      .eq('id', id)
      .select('*, workers(*)')
      .single();

    if (updateError) {
      console.error('Error updating assessment to approved:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return new NextResponse(
      JSON.stringify({ 
        success: true, 
        score: grandTotal, 
        level, 
        status: 'approved',
        assessment: updatedAssessment 
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
    console.error('Approve exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


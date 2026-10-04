import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request, { params }) {
  try {
    const { assessmentId } = params;

    const { data: assessment, error } = await supabase
      .from('assessments')
      .select('*, workers(*)')
      .eq('id', assessmentId)
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

    return new NextResponse(
      JSON.stringify({
        assessment,
        answers: answers || [],
        proofs: proofs || []
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

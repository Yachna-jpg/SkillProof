import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('*, workers(name, phone, language)')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: answers } = await supabase
      .from('answers')
      .select('assessment_id, needs_manual_review, low_confidence');

    const list = (assessments || []).map(a => {
      const ans = (answers || []).filter(item => item.assessment_id === a.id);
      const needsCheck = ans.some(item => item.needs_manual_review || item.low_confidence);
      return {
        ...a,
        workerName: a.workers ? a.workers.name : 'Unknown',
        workerPhone: a.workers ? a.workers.phone : 'N/A',
        workerLanguage: a.workers ? a.workers.language : 'Unknown',
        needsCheck,
        score: a.total_score,
        startTime: a.created_at
      };
    });

    list.sort((a, b) => (b.needsCheck === true) - (a.needsCheck === true));
    return new NextResponse(
      JSON.stringify({ assessments: list }),
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

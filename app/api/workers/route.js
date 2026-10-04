import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const phone = searchParams.get('phone');

    let query = supabase.from('workers').select('*');
    if (id) {
      query = query.eq('id', id);
    } else if (phone) {
      query = query.eq('phone', phone);
    } else {
      return NextResponse.json({ error: 'Missing id or phone' }, { status: 400 });
    }

    const { data, error } = await query.single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return new NextResponse(
      JSON.stringify({ worker: data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (!name || cleanPhone.length !== 10) {
      return NextResponse.json({ error: 'Invalid name or 10-digit phone number' }, { status: 400 });
    }

    // Check if worker already exists with this phone number
    const { data: existingWorker } = await supabase
      .from('workers')
      .select('*')
      .eq('phone', cleanPhone)
      .maybeSingle();

    if (existingWorker) {
      const { data: updated, error: updateErr } = await supabase
        .from('workers')
        .update({ name: name.trim() })
        .eq('id', existingWorker.id)
        .select()
        .single();

      const workerResult = (!updateErr && updated) ? updated : existingWorker;
      return new NextResponse(
        JSON.stringify({ worker: workerResult }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          }
        }
      );
    }

    // Insert new worker
    const { data, error } = await supabase
      .from('workers')
      .insert({ name: name.trim(), phone: cleanPhone, language: 'en' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(
      JSON.stringify({ worker: data }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

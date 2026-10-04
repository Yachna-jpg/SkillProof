import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getQuestionsData } from '@/lib/questions';

export const dynamic = 'force-dynamic';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function getAIResult(systemPrompt, userPrompt, retryCount = 0) {
  if (!process.env.AI_SECRET_KEY) {
    console.warn("AI_SECRET_KEY is not defined");
    return null;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AI_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      // Try fallback model if the specified one fails
      const fallbackResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AI_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-20b',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!fallbackResponse.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }

      const fbData = await fallbackResponse.json();
      const parsedFb = JSON.parse(fbData.choices[0].message.content);
      return parsedFb;
    }

    const data = await response.json();
    const jsonStr = data.choices[0].message.content;
    const parsed = JSON.parse(jsonStr);

    if (typeof parsed.marks !== 'number' || parsed.marks > 20) {
      throw new Error("Invalid marks format");
    }
    return parsed;
  } catch (err) {
    console.error("AI Error:", err.message);
    if (retryCount === 0) {
      return getAIResult(systemPrompt, userPrompt, 1);
    } else if (retryCount === 1) {
      await sleep(1500);
      return getAIResult(systemPrompt, userPrompt, 2);
    }
    return null;
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { assessmentId, questionId, text, language = 'en' } = body;

    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('*')
      .eq('assessment_id', assessmentId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (existingAnswer && existingAnswer.ai_marks != null) {
      const { data, error } = await supabase
        .from('answers')
        .update({ answer_text: text })
        .eq('id', existingAnswer.id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ result: data });
    }

    const qData = getQuestionsData();
    const question = (qData.questions || []).find(q => q.id === questionId);

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const systemPrompt = `You are an expert skill assessor for trade workers in India.
Your ONLY job is to evaluate if the worker's answer conveys the correct meaning based on the provided 'Correct points'.
CRITICAL RULES:
1. The worker's answer may be in English, Hindi, or a mix of both (Hinglish). You MUST understand the mixed language and focus purely on the MEANING.
2. The score must be divided into chunks of 0 to 20 points.
3. You must only give points if the answer is correct or based on the accuracy/closeness to the correct answer.
4. If the meaning is completely incorrect or irrelevant, give 0 marks.
5. Do NOT deduct marks for bad grammar, broken English/Hindi, or spelling mistakes.
6. Reply with ONLY valid JSON, no extra text.`;

    const userPrompt = `Question: ${language === 'hi' ? question.question_hi : question.question_en}
Max marks: 20
Correct points: ${(question.correct_points || []).join(' | ')}
Worker answer: ${text}

Required JSON:
{
 "marks": number from 0 to 20,
 "reason": "one short simple sentence in the worker's language"
}`;

    const aiResult = await getAIResult(systemPrompt, userPrompt);

    const finalResult = {
      assessment_id: assessmentId,
      question_id: questionId,
      answer_text: text,
      needs_manual_review: false,
      low_confidence: false,
      ai_marks: null,
      reason: 'Needs assessor check'
    };

    if (!aiResult) {
      finalResult.needs_manual_review = true;
    } else {
      finalResult.ai_marks = Math.min(20, Math.max(0, Number(aiResult.marks) || 0));
      finalResult.reason = aiResult.reason || 'Assessed by AI';
    }

    let data, error;
    if (existingAnswer) {
      ({ data, error } = await supabase
        .from('answers')
        .update(finalResult)
        .eq('id', existingAnswer.id)
        .select()
        .single());
    } else {
      ({ data, error } = await supabase
        .from('answers')
        .insert(finalResult)
        .select()
        .single());
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ result: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

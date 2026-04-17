/**
 * ==========================================
 *  Title:  TwinMind AI Meeting Copilot
 *  Author: SIDDHARTH NAIN
 * ==========================================
 */
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-groq-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing API Key' }, { status: 401 });
    }

    const body = await req.json();
    const { transcript, prompt } = body;

    if (!transcript || transcript.trim().length < 20) {
      return NextResponse.json({ error: 'Insufficient transcript' }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    const userContent = 'Here is the recent meeting transcript:\n\n' + transcript + '\n\nGenerate exactly 3 suggestions as JSON.';

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system' as const, content: prompt },
        { role: 'user' as const, content: userContent },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('Empty response from model');
    }

    const parsed = JSON.parse(result);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Suggestion generation failed';
    console.error('Suggestions Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

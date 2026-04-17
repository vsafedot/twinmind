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
    const { messages, prompt, transcript } = body;

    const groq = new Groq({ apiKey });

    const systemContent = prompt + '\n\nFull Meeting Transcript:\n' + (transcript || '(No transcript yet)');

    const fullMessages = [
      { role: 'system' as const, content: systemContent },
      ...messages,
    ];

    const stream = await groq.chat.completions.create({
      messages: fullMessages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (e) {
          console.error('Stream error:', e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat failed';
    console.error('Chat Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

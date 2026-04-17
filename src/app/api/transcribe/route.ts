// Made by SIDDHARTH NAIN
import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get('x-groq-api-key');
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing Groq API Key' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as Blob;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'Missing or empty audio file' }, { status: 400 });
    }

    const audioFile = new File([file], 'audio.webm', {
      type: file.type || 'audio/webm',
    });

    const groq = new Groq({ apiKey });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      response_format: 'json',
      language: 'en',
    });

    return NextResponse.json({ text: transcription.text || '' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Transcription failed';
    console.error('Transcription Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

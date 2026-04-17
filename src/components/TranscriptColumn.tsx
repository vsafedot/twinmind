/**
 * ==========================================
 *  Title:  TwinMind AI Meeting Copilot
 *  Author: SIDDHARTH NAIN
 * ==========================================
 */
"use client";
import { useState, useEffect, useRef } from 'react';
import { Mic, Square, Download } from 'lucide-react';
import { AppSettings, TranscriptChunk } from '@/lib/types';

interface Props {
  settings: AppSettings | null;
  chunks: TranscriptChunk[];
  onNewChunk: (text: string) => void;
  onExport: () => void;
  isRecording: boolean;
  setIsRecording: (v: boolean) => void;
}

export default function TranscriptColumn({ settings, chunks, onNewChunk, onExport, isRecording, setIsRecording }: Props) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef(settings);
  const [isTranscribing, setIsTranscribing] = useState(false);

  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chunks]);

  const sendAudioChunk = async (blob: Blob) => {
    const key = settingsRef.current?.groqApiKey;
    if (!key || blob.size < 1000) return;
    setIsTranscribing(true);
    try {
      const fd = new FormData();
      fd.append('file', blob, 'audio.webm');
      const res = await fetch('/api/transcribe', { method: 'POST', headers: { 'x-groq-api-key': key }, body: fd });
      const data = await res.json();
      if (data.text?.trim()) onNewChunk(data.text.trim());
    } catch (e) { console.error('Transcription error:', e); }
    finally { setIsTranscribing(false); }
  };

  const createRecorder = (stream: MediaStream) => {
    const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    rec.ondataavailable = async (e) => { if (e.data.size > 0) await sendAudioChunk(e.data); };
    rec.start();
    mediaRecorderRef.current = rec;
  };

  const startMic = async () => {
    if (!settingsRef.current?.groqApiKey) { alert('Set your Groq API key first (top-right button).'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 } });
      streamRef.current = stream;
      createRecorder(stream);
      setIsRecording(true);
      const iv = (settingsRef.current?.refreshIntervalSeconds || 30) * 1000;
      intervalRef.current = setInterval(() => {
        if (mediaRecorderRef.current?.state === 'recording') { mediaRecorderRef.current.stop(); createRecorder(stream); }
      }, iv);
    } catch { alert('Microphone access denied. Please allow permissions in your browser.'); }
  };

  const stopMic = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
  };

  return (
    <>
      <div className="panel-header">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-400">
          Transcript
        </span>
        <div className="flex items-center gap-3">
          {isTranscribing && (
            <span className="text-[10px] font-mono text-zinc-500 animate-pulse">transcribing...</span>
          )}
          <span className={`text-[10px] font-mono font-bold ${isRecording ? 'text-red-500' : 'text-zinc-500'}`}>
            {isRecording ? 'REC' : 'IDLE'}
          </span>
          <button onClick={onExport} className="p-1.5 text-zinc-400 hover:text-zinc-200 transition-colors bg-zinc-800/50 hover:bg-zinc-800 rounded text-xs px-2 flex items-center gap-1.5 border border-zinc-700/50">
            <Download size={12} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="p-5 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-4 shrink-0">
        <div className="relative flex items-center justify-center">
          <button
            onClick={isRecording ? stopMic : startMic}
            className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] pulse-ring-active' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg border-2 border-transparent hover:scale-105'
            }`}
          >
            {isRecording ? <Square size={16} className="fill-current" /> : <Mic size={20} />}
          </button>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">
            {isRecording ? 'Recording active' : 'Start meeting'}
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isRecording ? 'Translating live audio to text' : 'Click to authorize microphone'}
          </p>
        </div>
      </div>

      <div className="panel-body bg-zinc-950/20" ref={scrollRef}>
        {chunks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center opacity-70">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
              <Mic size={20} className="text-zinc-500" />
            </div>
            <p className="text-sm text-zinc-400">Waiting for audio...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {chunks.map((chunk) => (
              <div key={chunk.id} className="animate-fade-in-up">
                <div className="text-[10px] font-mono text-zinc-500 mb-1">
                  {new Date(chunk.timestamp).toLocaleTimeString()}
                </div>
                <p className="text-[14px] leading-relaxed text-zinc-300">{chunk.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

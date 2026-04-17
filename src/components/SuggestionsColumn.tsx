// Made by SIDDHARTH NAIN
"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, Zap, Sparkles } from 'lucide-react';
import { AppSettings, SuggestionBatch, Suggestion } from '@/lib/types';

interface Props {
  settings: AppSettings | null;
  transcript: string;
  batches: SuggestionBatch[];
  setBatches: React.Dispatch<React.SetStateAction<SuggestionBatch[]>>;
  onSuggestionClick: (s: Suggestion) => void;
  triggerRefresh: number;
}

function badgeClass(type: string) {
  const t = type.toLowerCase();
  if (t.includes('question'))   return 'badge badge-question';
  if (t.includes('talking'))    return 'badge badge-talking-point';
  if (t.includes('answer'))     return 'badge badge-answer';
  if (t.includes('fact'))       return 'badge badge-fact-check';
  if (t.includes('clarif'))     return 'badge badge-clarification';
  return 'badge badge-default';
}

export default function SuggestionsColumn({ settings, transcript, batches, setBatches, onSuggestionClick, triggerRefresh }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const settingsRef = useRef(settings);
  const transcriptRef = useRef(transcript);
  const isLoadingRef = useRef(false);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  const fetchSuggestions = useCallback(async () => {
    const s = settingsRef.current;
    const t = transcriptRef.current;
    if (!s?.groqApiKey || t.length < 30 || isLoadingRef.current) return;

    setIsLoading(true); isLoadingRef.current = true;
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'x-groq-api-key': s.groqApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: t.slice(-s.suggestionContextWindow), prompt: s.liveSuggestionPrompt }),
      });
      const data = await res.json();
      if (Array.isArray(data.suggestions)) {
        setBatches((prev) => [{ id: Date.now().toString(), timestamp: Date.now(), items: data.suggestions.slice(0, 3) }, ...prev]);
      }
    } catch (e) { console.error('Suggestions error:', e); }
    finally { setIsLoading(false); isLoadingRef.current = false; }
  }, [setBatches]);

  useEffect(() => {
    if (!triggerRefresh) return;
    const interval = settingsRef.current?.refreshIntervalSeconds || 30;
    setCountdown(interval);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { fetchSuggestions(); return settingsRef.current?.refreshIntervalSeconds || 30; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [triggerRefresh, fetchSuggestions]);

  return (
    <>
      {/* Column header */}
      <div className="panel-header">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-400">
          Live Context
        </span>
        <span className="text-[10px] font-mono text-zinc-500">
          {batches.length} batch{batches.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {/* Controls row */}
      <div className="px-5 py-3 border-b border-zinc-800 shrink-0 flex items-center justify-between bg-zinc-900/40">
        <button
          onClick={fetchSuggestions}
          disabled={isLoading || transcript.length < 30}
          className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-2"
        >
          <RefreshCw size={12} className={`${isLoading ? 'animate-spin text-blue-500' : 'text-zinc-400'}`} />
          <span>{isLoading ? 'Analyzing context...' : 'Force reload'}</span>
        </button>
        {transcript.length >= 30 && (
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded flex items-center px-2 py-1 gap-1.5">
            <Zap size={10} className="text-amber-500" />
            <span className="text-[10px] font-mono text-zinc-400">
              auto in {countdown}s
            </span>
          </div>
        )}
      </div>

      {/* Suggestions scroll */}
      <div className="panel-body space-y-6">

        {/* Skeleton loading */}
        {isLoading && batches.length === 0 && (
          <div className="space-y-4">
            {[0,1,2].map((i) => (
              <div key={i} className="shimmer-loading h-24 rounded-lg bg-zinc-800/50 border border-zinc-800" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && batches.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 mt-10 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
              <Sparkles size={18} className="text-blue-500" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">No suggestions yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">
              Suggestions will appear automatically as the conversation progresses.
            </p>
          </div>
        )}

        {batches.map((batch, bIdx) => (
          <div
            key={batch.id}
            className={`space-y-3 ${bIdx === 0 ? 'animate-fade-in-up transform-gpu' : 'opacity-60 saturate-50 hover:opacity-100 hover:saturate-100 transition-all duration-300'}`}
          >
            {/* Batch timestamp */}
            <div className="flex items-center gap-2 px-1">
              <span className={`w-1.5 h-1.5 rounded-full ${bIdx === 0 ? 'bg-blue-500' : 'bg-zinc-600'}`} />
              <span className="text-[10px] font-mono text-zinc-500">
                {new Date(batch.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {batch.items.map((s, i) => (
              <div
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => onSuggestionClick(s)}
                className="group p-4 bg-[#18181b] hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-600 rounded-xl text-left cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 outline-none focus:ring-2 focus:ring-blue-500/50"
                onKeyDown={(e) => { if (e.key === 'Enter') onSuggestionClick(s); }}
              >
                <span className={badgeClass(s.type)}>{s.type}</span>
                <p className="text-[13px] leading-relaxed mt-2.5 text-zinc-300 group-hover:text-zinc-100 transition-colors">
                  {s.preview}
                </p>
              </div>
            ))}
            
            {bIdx < batches.length - 1 && <div className="h-px bg-zinc-800/50 mx-4 my-2" />}
          </div>
        ))}
      </div>
    </>
  );
}

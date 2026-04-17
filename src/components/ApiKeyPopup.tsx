// Made by SIDDHARTH NAIN
"use client";
import { useState, useEffect } from 'react';
import { KeyRound, ExternalLink } from 'lucide-react';
import { AppSettings } from '@/lib/types';
import { DEFAULT_SUGGESTION_PROMPT, DEFAULT_DETAILED_ANSWER_PROMPT, DEFAULT_CHAT_PROMPT } from '@/lib/prompts';

export default function ApiKeyPopup({ onSettingsChange }: { onSettingsChange: (s: AppSettings) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('twinmind_settings');
    if (raw) { try { if (JSON.parse(raw).groqApiKey) return; } catch {} }
    const t = setTimeout(() => setShow(true), 200);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const handleSubmit = () => {
    const k = key.trim();
    if (!k) { setError('Please enter your API key.'); return; }
    if (!k.startsWith('gsk_')) { setError('Groq API keys start with "gsk_"'); return; }
    const s: AppSettings = {
      groqApiKey: k,
      liveSuggestionPrompt: DEFAULT_SUGGESTION_PROMPT,
      detailedAnswerPrompt: DEFAULT_DETAILED_ANSWER_PROMPT,
      chatPrompt: DEFAULT_CHAT_PROMPT,
      suggestionContextWindow: 6000,
      detailedAnswerContextWindow: 12000,
      refreshIntervalSeconds: 30,
    };
    localStorage.setItem('twinmind_settings', JSON.stringify(s));
    onSettingsChange(s);
    setShow(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur">
      <div className="animate-fade-in-up bg-[#18181b] border border-zinc-800 shadow-2xl rounded-2xl w-[420px] max-w-[90vw] overflow-hidden">

        {/* Top accent bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-500" />

        <div className="px-8 py-8">
          {/* Icon */}
          <div className="w-12 h-12 flex items-center justify-center mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-inner">
            <KeyRound size={24} />
          </div>

          <h2 className="text-xl font-bold mb-2 text-zinc-100">Welcome to TwinMind</h2>
          <p className="text-[13px] text-zinc-400 leading-relaxed mb-6">
            Enter your Groq API key to enable real-time transcription and AI suggestions.
            Your key is stored locally and never leaves your browser.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div className="mb-2">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">
                Groq API Key
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => { setKey(e.target.value); setError(''); }}
                placeholder="gsk_..."
                autoFocus
                autoComplete="current-password"
                className="input-flat w-full px-4 py-3 text-sm shadow-inner"
              />
            </div>
            {error && <p className="text-xs text-red-400 mt-1.5 mb-2">{error}</p>}

            <a
              href="https://console.groq.com/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-400 transition-colors my-4"
            >
              <ExternalLink size={12} /> Get a free key from console.groq.com
            </a>

            <button type="submit" className="btn-primary w-full py-3 mt-2 text-sm shadow-md shadow-blue-500/20">
              Start Using TwinMind
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

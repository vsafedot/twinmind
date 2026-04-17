/**
 * ==========================================
 *  Title:  TwinMind AI Meeting Copilot
 *  Author: SIDDHARTH NAIN
 * ==========================================
 */
"use client";
import { useState, useEffect } from 'react';
import { Settings, X, RotateCcw } from 'lucide-react';
import { AppSettings } from '@/lib/types';
import { DEFAULT_SUGGESTION_PROMPT, DEFAULT_DETAILED_ANSWER_PROMPT, DEFAULT_CHAT_PROMPT } from '@/lib/prompts';

const DEFAULTS: AppSettings = {
  groqApiKey: '', liveSuggestionPrompt: DEFAULT_SUGGESTION_PROMPT,
  detailedAnswerPrompt: DEFAULT_DETAILED_ANSWER_PROMPT, chatPrompt: DEFAULT_CHAT_PROMPT,
  suggestionContextWindow: 6000, detailedAnswerContextWindow: 12000, refreshIntervalSeconds: 30,
};

export default function SettingsModal({ onSettingsChange, openFromOutside, onOpenHandled }: {
  onSettingsChange: (s: AppSettings) => void;
  openFromOutside?: boolean;
  onOpenHandled?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (openFromOutside) { setIsOpen(true); onOpenHandled?.(); }
  }, [openFromOutside, onOpenHandled]);

  useEffect(() => {
    const raw = localStorage.getItem('twinmind_settings');
    if (raw) {
      try { const m = { ...DEFAULTS, ...JSON.parse(raw) }; setSettings(m); onSettingsChange(m); }
      catch { onSettingsChange(DEFAULTS); }
    }
  }, []);

  const save = () => {
    localStorage.setItem('twinmind_settings', JSON.stringify(settings));
    onSettingsChange(settings); setSaved(true);
    setTimeout(() => { setSaved(false); setIsOpen(false); }, 700);
  };

  const update = (f: keyof AppSettings, v: string | number) => setSettings((p) => ({ ...p, [f]: v }));

  const inputCls = 'input-flat w-full px-3 py-2 text-sm';
  const textareaCls = 'input-flat w-full px-3 py-2 text-xs font-mono leading-relaxed resize-y';
  const labelCls = 'block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2';

  if (!isOpen) return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-5 left-5 z-50 p-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-full shadow-lg transition-colors"
      title="Settings"
    >
      <Settings size={20} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="flex flex-col w-[580px] max-w-[90vw] max-h-[85vh] bg-[#18181b] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#09090b]/50 shrink-0">
          <h2 className="text-sm font-bold text-zinc-100">Settings</h2>
          <div className="flex items-center gap-3">
            <button onClick={() => setSettings({ ...DEFAULTS, groqApiKey: settings.groqApiKey })} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded bg-transparent border-transparent hover:border-zinc-700">
              <RotateCcw size={12} className="text-zinc-400" />
              <span>Reset Prompts</span>
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* API Key */}
          <div className="bg-[#09090b] border border-blue-500/20 p-5 rounded-xl shadow-sm">
            <label className={labelCls} style={{ color: '#3b82f6' }}>Groq API Key</label>
            <input
              type="password"
              value={settings.groqApiKey}
              onChange={(e) => update('groqApiKey', e.target.value)}
              className={inputCls}
              placeholder="gsk_..."
              autoComplete="current-password"
            />
            <p className="text-[11px] mt-2.5 text-zinc-500">Your key is stored locally in your browser and used directly for requests.</p>
          </div>

          {/* Numeric settings */}
          <div>
            <label className={labelCls}>Timing & Context Adjustments</label>
            <div className="grid grid-cols-3 gap-4">
              {([
                ['Refresh (sec)', 'refreshIntervalSeconds', 10, 120, 1],
                ['Suggest ctx', 'suggestionContextWindow', 500, 20000, 500],
                ['Answer ctx', 'detailedAnswerContextWindow', 500, 40000, 500],
              ] as [string, keyof AppSettings, number, number, number][]).map(([label, field, min, max, step]) => (
                <div key={field}>
                  <div className="text-[10px] text-zinc-500 mb-1.5">{label}</div>
                  <input
                    type="number" min={min} max={max} step={step}
                    value={settings[field] as number}
                    onChange={(e) => update(field, Number(e.target.value))}
                    className={`${inputCls} text-center font-mono`}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-800" />

          {/* Prompts */}
          {([
            ['Live Suggestion Prompt', 'liveSuggestionPrompt', 5],
            ['Detailed Answer Prompt (on click)', 'detailedAnswerPrompt', 5],
            ['Chat Prompt (free-form)', 'chatPrompt', 4],
          ] as [string, keyof AppSettings, number][]).map(([label, field, rows]) => (
            <div key={field}>
              <label className={labelCls}>{label}</label>
              <textarea
                rows={rows}
                value={settings[field] as string}
                onChange={(e) => update(field, e.target.value)}
                className={textareaCls}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 bg-[#09090b]/50 shrink-0">
          <button onClick={save} className={`btn-primary w-full py-3 text-sm font-bold shadow-md ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}>
            {saved ? '✓ Saved Successfully' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}

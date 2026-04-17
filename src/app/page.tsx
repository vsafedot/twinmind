// Made by SIDDHARTH NAIN
"use client";
import { useState, useCallback } from 'react';
import TranscriptColumn from '@/components/TranscriptColumn';
import SuggestionsColumn from '@/components/SuggestionsColumn';
import ChatColumn from '@/components/ChatColumn';
import SettingsModal from '@/components/SettingsModal';
import ApiKeyPopup from '@/components/ApiKeyPopup';
import {
  AppSettings, ChatMessage, SuggestionBatch, Suggestion, TranscriptChunk,
} from '@/lib/types';

export default function Home() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [chunks, setChunks] = useState<TranscriptChunk[]>([]);
  const [batches, setBatches] = useState<SuggestionBatch[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const [triggerRefresh, setTriggerRefresh] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);

  const fullTranscript = chunks.map((c) => c.text).join(' ');

  const handleNewChunk = useCallback((text: string) => {
    setChunks((prev) => [...prev, { id: 'tc-' + Date.now(), text, timestamp: Date.now() }]);
    setTriggerRefresh(Date.now());
  }, []);

  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    setPendingQuery(
      'Expand on this ' + suggestion.type.toLowerCase() + ' from the meeting: "' + suggestion.preview + '"'
    );
  }, []);

  const exportSession = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      transcript: chunks.map((c) => ({ time: new Date(c.timestamp).toISOString(), text: c.text })),
      suggestionBatches: batches.map((b) => ({ time: new Date(b.timestamp).toISOString(), suggestions: b.items })),
      chatHistory: chatMessages.map((m) => ({ time: new Date(m.timestamp).toISOString(), role: m.role, content: m.content })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twinmind-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [chunks, batches, chatMessages]);

  const handleSettingsChange = useCallback((s: AppSettings) => setSettings(s), []);
  const hasApiKey = Boolean(settings?.groqApiKey);

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-zinc-950 text-zinc-50">

      {/* ── Top Bar ───────────────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-6 shrink-0 border-b border-zinc-800 bg-zinc-900/50">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-600 shadow-sm border border-blue-500">
            <div className="w-3 h-3 bg-white rounded-full opacity-90" />
          </div>
          <span className="text-sm font-bold tracking-wide text-zinc-100">TwinMind</span>
          <span className="text-xs hidden sm:inline text-zinc-400">AI Meeting Copilot</span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-bold font-mono text-red-400 tracking-widest">LIVE</span>
            </div>
          )}
          {/* API Key pill */}
          <button
            onClick={() => setOpenSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold bg-zinc-800 hover:bg-zinc-700 transition-colors rounded-lg border border-zinc-700 text-zinc-300"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: hasApiKey ? '#10b981' : '#ef4444' }}
            />
            <span>
              {hasApiKey ? 'API Key Set' : 'Setup API Key'}
            </span>
          </button>
        </div>
      </header>

      {/* ── 3-Column Layout ───────────────────────────────── */}
      <main className="flex-1 overflow-hidden flex p-4 gap-4">

        {/* Column 1 — Transcript */}
        <div className="w-[30%] min-w-[280px] panel flex flex-col">
          <TranscriptColumn
            settings={settings}
            chunks={chunks}
            onNewChunk={handleNewChunk}
            onExport={exportSession}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
          />
        </div>

        {/* Column 2 — Suggestions */}
        <div className="w-[35%] min-w-[300px] panel flex flex-col">
          <SuggestionsColumn
            settings={settings}
            transcript={fullTranscript}
            batches={batches}
            setBatches={setBatches}
            onSuggestionClick={handleSuggestionClick}
            triggerRefresh={triggerRefresh}
          />
        </div>

        {/* Column 3 — Chat */}
        <div className="flex-1 min-w-[280px] panel flex flex-col">
          <ChatColumn
            settings={settings}
            transcript={fullTranscript}
            messages={chatMessages}
            setMessages={setChatMessages}
            pendingQuery={pendingQuery}
            onPendingHandled={() => setPendingQuery(null)}
          />
        </div>
      </main>

      <SettingsModal
        onSettingsChange={handleSettingsChange}
        openFromOutside={openSettings}
        onOpenHandled={() => setOpenSettings(false)}
      />
      {!hasApiKey && <ApiKeyPopup onSettingsChange={handleSettingsChange} />}
    </div>
  );
}

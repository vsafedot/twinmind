/**
 * ==========================================
 *  Title:  TwinMind AI Meeting Copilot
 *  Author: SIDDHARTH NAIN
 * ==========================================
 */
"use client";
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { AppSettings, ChatMessage } from '@/lib/types';

interface Props {
  settings: AppSettings | null;
  transcript: string;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  pendingQuery: string | null;
  onPendingHandled: () => void;
}

export default function ChatColumn({ settings, transcript, messages, setMessages, pendingQuery, onPendingHandled }: Props) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef(settings);
  const transcriptRef = useRef(transcript);
  const messagesRef = useRef(messages);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const streamChat = useCallback(async (userText: string, prompt: string) => {
    const s = settingsRef.current;
    if (!s?.groqApiKey || !userText.trim()) return;

    const userMsg: ChatMessage = { id: 'u-' + Date.now(), role: 'user', content: userText, timestamp: Date.now() };
    const aId = 'a-' + Date.now();
    setMessages((prev) => [...prev, userMsg, { id: aId, role: 'assistant', content: '', timestamp: Date.now() }]);
    setIsStreaming(true);

    try {
      const apiMsgs = [...messagesRef.current, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'x-groq-api-key': s.groqApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMsgs, prompt, transcript: transcriptRef.current.slice(-(s.detailedAnswerContextWindow || 12000)) }),
      });
      if (!res.body) throw new Error('No body');
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value);
        const captured = full;
        setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, content: captured } : m));
      }
    } catch (e) {
      console.error('Chat error:', e);
      setMessages((prev) => prev.map((m) => m.id === aId ? { ...m, content: 'Error — check your API key or connection.' } : m));
    } finally { setIsStreaming(false); }
  }, [setMessages]);

  useEffect(() => {
    if (pendingQuery && !isStreaming) {
      streamChat(pendingQuery, settingsRef.current?.detailedAnswerPrompt || settingsRef.current?.chatPrompt || '');
      onPendingHandled();
    }
  }, [pendingQuery]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    const t = input; setInput('');
    streamChat(t, settingsRef.current?.chatPrompt || '');
  };

  return (
    <>
      {/* Column header */}
      <div className="panel-header">
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-zinc-400">Ask Copilot</span>
        <span className="text-[10px] font-mono font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">Chat</span>
      </div>

      {/* Messages */}
      <div className="panel-body space-y-5 bg-zinc-950/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-80">
            <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mb-3">
              <MessageSquare size={20} className="text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-300">How can I help?</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-[200px]">Click a suggestion or ask a custom question about the meeting.</p>
          </div>
        ) : messages.map((m) => (
          <div key={m.id} className={`animate-fade-in-up flex flex-col ${m.role === 'user' ? 'items-end pl-10' : 'items-start pr-10'}`}>
            <div
              className={`px-4 py-3 text-[14px] leading-relaxed whitespace-pre-wrap ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-sm' 
                  : 'bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-2xl rounded-tl-sm shadow-sm'
              }`}
            >
              {m.content || (
                <div className="flex items-center gap-1 h-5 px-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-zinc-500 mt-1.5 px-2">
              {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={endRef} className="h-2" />
      </div>

      {/* Input row */}
      <div className="p-4 border-t border-zinc-800 bg-[#18181b] shrink-0">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask a question..."
            disabled={isStreaming}
            className="input-flat w-full pl-4 pr-12 py-3 text-sm shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-md transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-[10px] text-zinc-500 mt-2 text-center">Responses are generated based on the active transcript context.</p>
      </div>
    </>
  );
}

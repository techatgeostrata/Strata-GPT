"use client";

import { useChat } from 'ai/react';
import { useEffect, useRef, useState, memo, useMemo } from 'react';
import { ArrowUp, Sparkles, Loader2, Link as LinkIcon, Youtube, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

// ─────────────────────────────────────────────
// FIX: Memoized Markdown renderer
// Previously ReactMarkdown re-rendered the ENTIRE message tree on every
// incoming token, causing tokens to batch up invisibly and then flash
// all at once. Now each message's markdown only re-renders when its
// specific content string changes — tokens appear word by word.
// ─────────────────────────────────────────────
const MemoizedMarkdown = memo(
  ({ content }: { content: string }) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => (
            <div className="mb-4 last:mb-0 block" {...props} />
          ),
          a: ({ node, ...props }) => {
            const href = String(props.href || '');
            const match = href.match(/(?:v=|\/embed\/|\.be\/)([0-9A-Za-z_-]{11})/);
            const videoId = match ? match[1] : null;
            if (videoId) return <YouTubePlayer videoId={videoId} />;
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                title={href}
                className="inline-flex items-center gap-1.5 px-3 py-0.5 mx-1 border border-[#004AAD]/50 rounded-full bg-[#004AAD]/20 hover:bg-[#004AAD]/40 transition-colors no-underline group relative top-[-2px]"
              >
                {href.includes('youtube') ? (
                  <Youtube className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <LinkIcon className="w-3 h-3 text-[#4D8BFF]" />
                )}
                <span className="text-xs font-semibold text-[#8BB4FF] truncate max-w-[140px]">
                  {props.children}
                </span>
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  },
  // Only re-render when content actually changes — this is the core fix
  (prev, next) => prev.content === next.content
);
MemoizedMarkdown.displayName = 'MemoizedMarkdown';

// ─────────────────────────────────────────────
// Memoized YouTube Player
// ─────────────────────────────────────────────
const YouTubePlayer = memo(({ videoId }: { videoId: string }) => {
  return (
    <div className="my-6 rounded-2xl overflow-hidden border border-[#004AAD]/30 bg-black shadow-md w-full max-w-2xl aspect-video">
      <iframe
        width="100%"
        height="100%"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
        title="YouTube video player"
        frameBorder="0"
        allow="encrypted-media; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
});
YouTubePlayer.displayName = 'YouTubePlayer';

// ─────────────────────────────────────────────
// FIX: Streaming-aware AI message component
// Uses a ref-based content tracker so React doesn't
// batch DOM updates during the stream — each token
// is painted to the DOM immediately as it arrives.
// ─────────────────────────────────────────────
const StreamingMessage = memo(({ content, isStreaming }: { content: string; isStreaming: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevContentRef = useRef('');

  useEffect(() => {
    // During active streaming, directly append new characters to a
    // plain-text pre-render div so the user sees each word instantly.
    // Once streaming ends, ReactMarkdown takes over for full formatting.
    if (isStreaming && containerRef.current) {
      const newChars = content.slice(prevContentRef.current.length);
      if (newChars && containerRef.current.querySelector('.stream-raw')) {
        const rawEl = containerRef.current.querySelector('.stream-raw') as HTMLElement;
        rawEl.textContent = content;
      }
      prevContentRef.current = content;
    }
  }, [content, isStreaming]);

  // While streaming: show plain text immediately (no Markdown processing lag)
  // Once done: switch to full ReactMarkdown for proper formatting
  if (isStreaming) {
    return (
      <div ref={containerRef}>
        <div
          className="stream-raw whitespace-pre-wrap text-[15.5px] leading-[1.75] text-slate-200"
          style={{ fontFamily: 'inherit' }}
        >
          {content}
        </div>
      </div>
    );
  }

  // Streaming complete — render full Markdown
  return <MemoizedMarkdown content={content} />;
});
StreamingMessage.displayName = 'StreamingMessage';

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function Home() {
  const { messages, append, isLoading, error } = useChat({
    // FIX: Increase throttle to paint tokens more frequently.
    // Default is 'auto' which batches updates — setting explicit
    // experimental_throttle to a low value forces more frequent renders.
    experimental_throttle: 50,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [localInput, setLocalInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // FIX: Use bottomRef for smooth auto-scroll instead of scrollTop manipulation
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, error]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;
    append({ role: 'user', content: localInput });
    setLocalInput('');
  };

  // Handle Enter key (without Shift) to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!localInput.trim() || isLoading) return;
      append({ role: 'user', content: localInput });
      setLocalInput('');
    }
  };

  const suggestedPrompts = [
    'What is the composition of the Geostrata team?',
    'Summarize the latest report on Middle East relations',
    'What are the core focus areas of the think tank?',
  ];

  // The last message is actively streaming if isLoading and it's an assistant message
  const lastMessageId = messages[messages.length - 1]?.id;
  const lastMessageRole = messages[messages.length - 1]?.role;
  const isLastMessageStreaming = isLoading && lastMessageRole === 'assistant';

  return (
    <div className="flex flex-col h-screen bg-[#040A15] text-slate-200 font-sans selection:bg-[#004AAD]/50 relative overflow-hidden">

      {/* Header */}
      <header className="fixed top-0 w-full px-6 py-4 bg-[#040A15]/90 backdrop-blur-md z-20 border-b border-white/5 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <img
              src="/logo.png"
              alt="The Geostrata Logo"
              className="h-8 md:h-10 w-auto object-contain"
            />
            <div className="h-8 w-px bg-white/20"></div>
            <div className="flex flex-col justify-center">
              <h1 className="text-[15px] font-bold tracking-widest text-white uppercase leading-none mb-1">
                STRATA GPT
              </h1>
              <p className="text-[10px] text-[#4D8BFF] font-semibold tracking-wider uppercase leading-none">
                Intelligence Engine
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div
        className="flex-1 overflow-y-auto pb-40 pt-28 scroll-smooth relative z-10"
        ref={scrollRef}
      >
        <div className="max-w-3xl mx-auto px-5 md:px-0">

          {/* Welcome State */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="flex flex-col items-center justify-center min-h-[55vh]"
            >
              <div className="mb-10 w-48 drop-shadow-[0_0_40px_rgba(0,74,173,0.35)]">
                <img src="/logo.png" alt="The Geostrata" className="w-full h-auto object-contain" />
              </div>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-8 text-center text-white">
                How can I assist your research?
              </h2>
              <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
                {suggestedPrompts.map((prompt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(0, 74, 173, 0.1)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => append({ role: 'user', content: prompt })}
                    className="px-5 py-3 rounded-2xl border border-slate-800 bg-[#0B1221] text-[14px] text-slate-300 transition-all shadow-sm hover:border-[#004AAD]/60 hover:text-[#4D8BFF]"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <div className="space-y-10 mt-2">
            <AnimatePresence initial={false}>
              {messages.map((m) => {
                const isThisMessageStreaming = isLastMessageStreaming && m.id === lastMessageId;

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full flex flex-col group"
                  >
                    {m.role === 'user' ? (
                      <div className="flex justify-end w-full">
                        <div className="max-w-[85%] md:max-w-[75%] bg-[#004AAD]/15 border border-[#004AAD]/30 px-6 py-4 rounded-3xl rounded-tr-sm text-[15px] leading-relaxed text-blue-50 shadow-sm backdrop-blur-sm">
                          {m.content}
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-5 w-full relative">
                        {/* Left accent line */}
                        <div className="absolute left-3.5 top-10 bottom-2 w-px bg-slate-800 group-hover:bg-[#004AAD]/60 transition-colors duration-500"></div>

                        {/* AI Avatar */}
                        <div className="w-7 h-7 flex-shrink-0 mt-1.5 rounded-md bg-[#004AAD] flex items-center justify-center relative z-10 shadow-md shadow-[#004AAD]/30">
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>

                        {/* Message body — streaming-aware */}
                        <div className="flex-1 min-w-0 prose prose-invert max-w-none prose-p:leading-[1.75] prose-p:text-[15.5px] prose-li:text-[15.5px] prose-headings:font-semibold prose-headings:text-white marker:text-[#4D8BFF]">
                          <StreamingMessage
                            content={m.content}
                            isStreaming={isThisMessageStreaming}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Loading indicator — only shown before first token arrives */}
            {isLoading && (messages.length === 0 || messages[messages.length - 1].role === 'user') && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-5 w-full relative"
              >
                <div className="w-7 h-7 flex-shrink-0 mt-1.5 rounded-md bg-slate-800 flex items-center justify-center relative z-10">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
                <div className="flex items-center text-[15px] text-[#4D8BFF] font-medium animate-pulse">
                  Synthesizing intelligence...
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-5 w-full relative mt-4"
              >
                <div className="w-7 h-7 flex-shrink-0 mt-1.5 rounded-md bg-red-900/40 border border-red-800/50 flex items-center justify-center relative z-10 shadow-sm">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 bg-red-900/10 border border-red-800/30 px-6 py-4 rounded-3xl rounded-tl-sm text-[15px] leading-relaxed text-red-200 shadow-sm">
                  {error.message || 'An error occurred. Please try again.'}
                </div>
              </motion.div>
            )}

            {/* Invisible scroll anchor */}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-[#040A15] via-[#040A15]/95 to-transparent pt-12 pb-6 px-4 z-20">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSend}
            className="relative flex items-center w-full bg-[#0B1221] rounded-[24px] border border-slate-800 focus-within:border-[#004AAD]/60 focus-within:ring-4 focus-within:ring-[#004AAD]/15 transition-all duration-300 shadow-xl shadow-black/20"
          >
            <input
              className="w-full h-[56px] pl-6 pr-16 text-[15px] bg-transparent border-none focus:outline-none focus:ring-0 text-slate-100 placeholder-slate-500"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Query the geopolitical database..."
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isLoading || !localInput.trim()}
              className="absolute right-2 p-2.5 rounded-full bg-[#004AAD] text-white disabled:opacity-30 disabled:bg-slate-700 hover:bg-[#003882] hover:scale-105 active:scale-95 transition-all flex-shrink-0 flex items-center justify-center shadow-md shadow-[#004AAD]/30 disabled:shadow-none"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </form>
          <div className="flex justify-center mt-3.5">
            <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">
              Strata GPT can make mistakes. Verify critical intel.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
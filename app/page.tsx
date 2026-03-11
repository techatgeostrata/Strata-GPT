"use client";

import { useChat } from 'ai/react'; 
import { useEffect, useRef, useState, memo } from 'react';
import { ArrowUp, Sparkles, Loader2, Link as LinkIcon, Youtube, BookOpen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// 🚀 Memoized YouTube Player (Untouched)
const YouTubePlayer = memo(({ videoId }: { videoId: string }) => {
  return (
    <div className="my-6 rounded-2xl overflow-hidden border border-blue-100 dark:border-blue-900/30 bg-black shadow-md w-full max-w-2xl aspect-video">
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
YouTubePlayer.displayName = "YouTubePlayer";

export default function Home() {
  const { messages, append, isLoading } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localInput, setLocalInput] = useState('');

  // Auto-scroll to the newest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim()) return;
    
    append({ role: 'user', content: localInput });
    setLocalInput('');
  };

  const suggestedPrompts = [
    "What is the composition of the Geostrata team?",
    "Summarize the latest report on Middle East relations",
    "What are the core focus areas of the think tank?",
  ];

  return (
    // Unique background: Pure white in light mode, deep rich navy-slate in dark mode
    <div className="flex flex-col h-screen bg-white dark:bg-[#0B1120] text-slate-900 dark:text-slate-200 font-sans selection:bg-blue-200 dark:selection:bg-blue-900/50">
      
      {/* Geostrata Header */}
      <header className="fixed top-0 w-full px-6 py-4 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-md z-10 border-b border-transparent dark:border-white/5 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/20">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-[14px] font-bold tracking-widest text-slate-900 dark:text-white uppercase leading-none">STRATA GPT</h1>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase mt-1">Intelligence Engine</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto pb-40 pt-24 scroll-smooth" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-5 md:px-0">
          
          {/* Welcome State */}
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-col items-center justify-center min-h-[55vh]"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-6 border border-blue-100 dark:border-blue-800/30">
                <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-8 text-center text-slate-900 dark:text-white">
                How can I assist your research?
              </h2>
              <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
                {suggestedPrompts.map((prompt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, backgroundColor: "var(--tw-colors-blue-50)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => append({ role: 'user', content: prompt })}
                    className="px-5 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-[14px] text-slate-600 dark:text-slate-300 transition-colors shadow-sm hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <div className="space-y-10 mt-2">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="w-full flex flex-col group"
                >
                  
                  {/* User Message - Anchor style bubble with blue hint */}
                  {m.role === 'user' ? (
                    <div className="flex justify-end w-full">
                      <div className="max-w-[85%] md:max-w-[75%] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 px-6 py-4 rounded-3xl rounded-tr-sm text-[15px] leading-relaxed text-blue-950 dark:text-blue-100 shadow-sm">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    
                    /* AI Message - "Intelligence Dossier" Style */
                    <div className="flex gap-5 w-full relative">
                      {/* Left Border Accent Line to make it look like a formal brief */}
                      <div className="absolute left-3.5 top-10 bottom-2 w-px bg-slate-200 dark:bg-slate-800 group-hover:bg-blue-300 dark:group-hover:bg-blue-800 transition-colors duration-500"></div>
                      
                      <div className="w-7 h-7 flex-shrink-0 mt-1.5 rounded-md bg-blue-600 flex items-center justify-center relative z-10 shadow-sm shadow-blue-600/20">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0 prose prose-slate dark:prose-invert max-w-none prose-p:leading-[1.75] prose-p:text-[15.5px] prose-li:text-[15.5px] prose-headings:font-semibold prose-headings:text-slate-900 dark:prose-headings:text-white marker:text-blue-400">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]} 
                          components={{
                            p: ({ node, ...props }) => <div className="mb-4 last:mb-0 block" {...props} />,
                            a: ({ node, ...props }) => {
                              const href = String(props.href || "");
                              
                              const match = href.match(/(?:v=|\/embed\/|\.be\/)([0-9A-Za-z_-]{11})/);
                              const videoId = match ? match[1] : null;

                              if (videoId) return <YouTubePlayer videoId={videoId} />;
                              
                              // Geostrata Blue Citation Pill
                              return (
                                <a 
                                  href={href} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  title={href}
                                  className="inline-flex items-center gap-1.5 px-3 py-0.5 mx-1 border border-blue-200 dark:border-blue-800/60 rounded-full bg-blue-50/50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors no-underline group relative top-[-2px]"
                                >
                                  {href.includes('youtube') ? (
                                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                                  ) : (
                                    <LinkIcon className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  )}
                                  <span className="text-xs font-semibold text-blue-800 dark:text-blue-300 truncate max-w-[140px]">
                                    {props.children}
                                  </span>
                                </a>
                              );
                            },
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading State */}
            {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-5 w-full relative">
                <div className="w-7 h-7 flex-shrink-0 mt-1.5 rounded-md bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative z-10">
                   <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </div>
                <div className="flex items-center text-[15px] text-slate-500 font-medium animate-pulse">
                  Synthesizing intelligence...
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Glassmorphism Input Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white via-white/95 to-transparent dark:from-[#0B1120] dark:via-[#0B1120]/95 pt-12 pb-6 px-4 z-20">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSend} 
            className="relative flex items-center w-full bg-white dark:bg-[#111827] rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-200/20 dark:shadow-none focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300"
          >
            <input
              className="w-full h-[56px] pl-6 pr-16 text-[15px] bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400"
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="Query the geopolitical database..."
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isLoading || !localInput.trim()}
              className="absolute right-2 p-2.5 rounded-full bg-blue-600 text-white disabled:opacity-30 disabled:bg-slate-300 dark:disabled:bg-slate-700 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all flex-shrink-0 flex items-center justify-center shadow-md shadow-blue-600/20 disabled:shadow-none"
            >
              <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
            </button>
          </form>
          <div className="flex justify-center mt-3.5">
             <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold tracking-widest uppercase">
               Strata GPT can make mistakes. Verify critical intel.
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}
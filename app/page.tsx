"use client";

import { useChat } from 'ai/react'; 
import { useEffect, useRef, useState, memo } from 'react';
import { Send, Globe, Sparkles, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; 
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// 🚀 THE MEMORY FIX: We wrap the player in 'memo' so React doesn't destroy it during AI streaming
const YouTubePlayer = memo(({ videoId }: { videoId: string }) => {
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-200 bg-black shadow-sm w-full aspect-video">
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

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 shadow-sm flex-none">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="bg-blue-900 p-2 rounded-lg">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">STRATA GPT</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider">PRODUCTION ENGINE v1.0</p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6" ref={scrollRef}>
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
          
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-32 text-slate-400">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50 text-blue-900" />
              <p className="text-lg font-medium">Ready to analyze global affairs.</p>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex gap-4", m.role === 'user' ? "justify-end" : "justify-start")}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={cn(
                  "max-w-[85%] rounded-2xl p-5 shadow-sm text-[15px] leading-relaxed overflow-hidden",
                  m.role === 'user' ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-800"
                )}>
                  {m.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]} 
                        components={{
                          p: ({ node, ...props }) => <div className="mb-4 last:mb-0 block" {...props} />,
                          a: ({ node, ...props }) => {
                            const href = String(props.href || "");
                            
                            const match = href.match(/(?:v=|\/embed\/|\.be\/)([0-9A-Za-z_-]{11})/);
                            const videoId = match ? match[1] : null;

                            if (videoId) {
                              // Instead of drawing a raw iframe, we render our frozen 'memoized' component
                              return <YouTubePlayer videoId={videoId} />;
                            }
                            
                            return <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold underline decoration-blue-300 underline-offset-2 hover:text-blue-800 transition-colors break-all" />;
                          },
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  )}
                </div>

                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-slate-600" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <Loader2 className="w-4 h-4 animate-spin text-blue-900" />
              </div>
              <div className="text-sm text-slate-400 flex items-center">
                Synthesizing intelligence...
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 flex-none">
        <div className="max-w-4xl mx-auto relative">
          <form onSubmit={handleSend} className="flex gap-2 relative">
            <input
              className="flex-1 p-4 pr-14 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
              value={localInput} 
              placeholder="Ask about defense strategy, trade routes, or specific YouTube interviews..."
              onChange={(e) => setLocalInput(e.target.value)} 
            />
            <button
              type="submit"
              disabled={isLoading || !localInput.trim()} 
              className="absolute right-2 top-2 p-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-3 uppercase tracking-widest font-semibold">
            Strata GPT • Production Engine
          </p>
        </div>
      </div>
    </div>
  );
}
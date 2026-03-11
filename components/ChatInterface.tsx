'use client';

import { useChat } from 'ai/react';
import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CitationCard from './CitationCard';

export default function ChatInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, setInput } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestedPrompts = [
    "What is the composition of the Geostrata team?",
    "Summarize the latest report on Middle East relations.",
    "What are the core focus areas of the think tank?",
  ];

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-[#212121] text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-200 dark:selection:bg-blue-900">
      
      {/* Top Navigation Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-white/80 dark:bg-[#212121]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">STRATA GPT</h1>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto pb-36 pt-8 scroll-smooth">
        <div className="max-w-3xl mx-auto px-4 md:px-0 space-y-8">
          
          {/* Empty State / Welcome Screen */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 dark:border-blue-800/30">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h2 className="text-2xl font-medium mb-8 text-center">How can I help you research today?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(prompt)}
                    className="text-left p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#2f2f2f] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] transition-all shadow-sm"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{prompt}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Map */}
          {messages.map((message) => (
            <div key={message.id} className="flex flex-col space-y-2 animate-in fade-in duration-300">
              
              {/* User Message - Right Aligned Bubble */}
              {message.role === 'user' ? (
                <div className="flex justify-end w-full">
                  <div className="max-w-[80%] bg-gray-100 dark:bg-[#2f2f2f] px-5 py-3.5 rounded-3xl rounded-tr-sm text-gray-900 dark:text-gray-100">
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                  </div>
                </div>
              ) : (
                
                /* AI Message - Left Aligned Prose */
                <div className="flex gap-4 w-full">
                  {/* AI Avatar */}
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center mt-1">
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  
                  {/* Rendered Markdown */}
                  <div className="flex-1 min-w-0 prose prose-gray dark:prose-invert max-w-none prose-p:leading-7 prose-p:text-[15px] prose-li:text-[15px] prose-headings:font-semibold prose-a:no-underline marker:text-gray-400">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <CitationCard href={props.href}>{props.children}</CitationCard>
                        )
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex gap-4 w-full animate-pulse">
              <div className="w-8 h-8 rounded-full bg-blue-600/50 flex-shrink-0 flex items-center justify-center mt-1"></div>
              <div className="flex-1 space-y-3 mt-2">
                <div className="h-4 bg-gray-200 dark:bg-[#2f2f2f] rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-[#2f2f2f] rounded w-1/2"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </main>

      {/* Floating Input Area */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent dark:from-[#212121] dark:via-[#212121] pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto">
          <form 
            onSubmit={handleSubmit} 
            className="relative flex items-end w-full bg-gray-100 dark:bg-[#2f2f2f] rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:border-blue-500 transition-all overflow-hidden p-2"
          >
            <input
              className="w-full max-h-32 min-h-[44px] px-4 py-3 text-[15px] bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
              value={input}
              onChange={handleInputChange}
              placeholder="Message STRATA GPT..."
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="mb-1 mr-1 p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-[#404040] disabled:text-gray-500 transition-colors flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </form>
          <p className="text-xs text-center text-gray-400 mt-3">
            STRATA GPT can make mistakes. Consider verifying critical geopolitical information.
          </p>
        </div>
      </div>

    </div>
  );
}
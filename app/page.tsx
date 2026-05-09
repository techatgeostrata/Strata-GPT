"use client";

import { useChat } from 'ai/react';
import { useEffect, useRef, useState, memo, useCallback } from 'react';
import {
  ArrowUp, Sparkles, Loader2, Link as LinkIcon, Youtube,
  AlertCircle, LogOut, MessageSquarePlus, ChevronLeft,
  ChevronRight, Trash2, User, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface SavedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// YOUTUBE PLAYER
// ─────────────────────────────────────────────
const YouTubePlayer = memo(({ videoId }: { videoId: string }) => (
  <div className="my-6 rounded-2xl overflow-hidden border border-[#004AAD]/30 bg-black shadow-md w-full max-w-2xl aspect-video">
    <iframe
      width="100%" height="100%"
      src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
      title="YouTube video player" frameBorder="0"
      allow="encrypted-media; picture-in-picture" allowFullScreen
    />
  </div>
));
YouTubePlayer.displayName = 'YouTubePlayer';

// ─────────────────────────────────────────────
// MEMOIZED MARKDOWN
// ─────────────────────────────────────────────
const MemoizedMarkdown = memo(
  ({ content }: { content: string }) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => <div className="mb-4 last:mb-0 block" {...props} />,
        a: ({ node, ...props }) => {
          const href = String(props.href || '');
          const match = href.match(/(?:v=|\/embed\/|\.be\/)([0-9A-Za-z_-]{11})/);
          const videoId = match ? match[1] : null;
          if (videoId) return <YouTubePlayer videoId={videoId} />;
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" title={href}
              className="inline-flex items-center gap-1.5 px-3 py-0.5 mx-1 border border-[#004AAD]/50 rounded-full bg-[#004AAD]/20 hover:bg-[#004AAD]/40 transition-colors no-underline relative top-[-2px]">
              {href.includes('youtube')
                ? <Youtube className="w-3.5 h-3.5 text-red-400" />
                : <LinkIcon className="w-3 h-3 text-[#4D8BFF]" />}
              <span className="text-xs font-semibold text-[#8BB4FF] truncate max-w-[140px]">{props.children}</span>
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  ),
  (prev, next) => prev.content === next.content
);
MemoizedMarkdown.displayName = 'MemoizedMarkdown';

// ─────────────────────────────────────────────
// STREAMING MESSAGE
// ─────────────────────────────────────────────
const StreamingMessage = memo(({ content, isStreaming }: { content: string; isStreaming: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prevContentRef = useRef('');

  useEffect(() => {
    if (isStreaming && containerRef.current) {
      const newChars = content.slice(prevContentRef.current.length);
      if (newChars && containerRef.current.querySelector('.stream-raw')) {
        const rawEl = containerRef.current.querySelector('.stream-raw') as HTMLElement;
        rawEl.textContent = content;
      }
      prevContentRef.current = content;
    }
  }, [content, isStreaming]);

  if (isStreaming) {
    return (
      <div ref={containerRef}>
        <div className="stream-raw whitespace-pre-wrap text-[15.5px] leading-[1.75] text-slate-200" style={{ fontFamily: 'inherit' }}>
          {content}
        </div>
      </div>
    );
  }

  return <MemoizedMarkdown content={content} />;
});
StreamingMessage.displayName = 'StreamingMessage';

// ─────────────────────────────────────────────
// AUTH MODAL
// ─────────────────────────────────────────────
function AuthModal({ onClose }: { onClose: () => void }) {
  const supabase = createClient();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [authError, setAuthError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');
    setMessage('');

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setAuthError(error.message);
      else setMessage('Check your email for a confirmation link.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message);
      else onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-[#0B1221] border border-slate-800 rounded-3xl p-8 shadow-2xl mx-4"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="The Geostrata" className="h-10 w-auto mb-4 object-contain" />
          <h2 className="text-xl font-bold text-white">Sign in to STRATA GPT</h2>
          <p className="text-sm text-slate-400 mt-1">Save and access your conversations</p>
        </div>

        <button
          onClick={handleGoogleLogin} disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-700 bg-[#131c2e] hover:bg-[#1a2540] transition-colors text-white font-medium text-[15px] mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-500">or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email address" required
            className="w-full bg-[#131c2e] border border-slate-700 rounded-2xl px-4 py-3 text-[15px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#004AAD]/60 focus:ring-2 focus:ring-[#004AAD]/15 transition-all"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full bg-[#131c2e] border border-slate-700 rounded-2xl px-4 py-3 text-[15px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#004AAD]/60 focus:ring-2 focus:ring-[#004AAD]/15 transition-all"
          />
          {authError && <p className="text-red-400 text-sm px-1">{authError}</p>}
          {message && <p className="text-green-400 text-sm px-1">{message}</p>}
          <button
            type="submit" disabled={loading}
            className="w-full py-3 rounded-2xl bg-[#004AAD] hover:bg-[#003882] text-white font-semibold text-[15px] transition-colors disabled:opacity-50"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setAuthError(''); setMessage(''); }}
            className="text-[#4D8BFF] hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR — clean, uncluttered layout
// ─────────────────────────────────────────────
function Sidebar({
  user, conversations, activeId, onNew, onSelect, onDelete,
  onSignOut, onSignIn, collapsed, onToggle,
}: {
  user: SupabaseUser | null;
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSignOut: () => void;
  onSignIn: () => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <motion.div
      animate={{ width: collapsed ? 60 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex-shrink-0 h-screen bg-[#070e1a] border-r border-white/5 flex flex-col z-30"
      style={{ overflow: 'visible' }}
    >
      {/* ── HEADER — logo row + collapse button ── */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/5 min-h-[56px]">
        {/* Logo — hidden when collapsed */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <img src="/logo.png" alt="Geostrata" className="h-7 w-auto object-contain" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse / expand toggle — always visible, right-aligned */}
        <button
          onClick={onToggle}
          className={`flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0 ${collapsed ? 'mx-auto' : 'ml-auto'}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* ── NEW CHAT BUTTON ── */}
      <div className="px-3 py-2 border-b border-white/5">
        <button
          onClick={onNew}
          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-[#004AAD]/15 hover:bg-[#004AAD]/25 border border-[#004AAD]/25 text-[#4D8BFF] transition-colors ${collapsed ? 'justify-center' : ''}`}
          title="New conversation"
        >
          <MessageSquarePlus className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.15 }}
                className="text-[13px] font-semibold overflow-hidden whitespace-nowrap"
              >
                New Chat
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* ── CONVERSATION LIST ── */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {!collapsed && user && conversations.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-8 px-2 leading-relaxed">
            No saved conversations yet.<br />Start chatting!
          </p>
        )}
        {!collapsed && !user && (
          <p className="text-xs text-slate-600 text-center py-8 px-3 leading-relaxed">
            Sign in to save and<br />view your conversations.
          </p>
        )}
        {!collapsed && conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
              activeId === conv.id
                ? 'bg-[#004AAD]/20 border border-[#004AAD]/30'
                : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-slate-300 truncate leading-snug">{conv.title}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{formatDate(conv.updated_at)}</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); onDelete(conv.id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-900/30 text-slate-500 hover:text-red-400 transition-all flex-shrink-0"
              title="Delete conversation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* ── USER / SIGN IN SECTION ── */}
      <div className="px-3 py-3 border-t border-white/5">
        {user ? (
          <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
            {/* Avatar circle */}
            <div className="w-7 h-7 rounded-full bg-[#004AAD]/40 border border-[#004AAD]/50 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-[#4D8BFF] uppercase">
                {user.email?.[0] ?? 'U'}
              </span>
            </div>
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <p className="text-[12px] text-slate-300 truncate">{user.email}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <User className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[13px] font-medium overflow-hidden whitespace-nowrap"
                >
                  Sign In
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function Home() {
  const supabase = createClient();

  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const { messages, append, setMessages, isLoading, error } = useChat({
    experimental_throttle: 50,
    body: {
      conversationId: activeConversationId,
      userId: user?.id ?? null,
    },
  });

  const [localInput, setLocalInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Auth ───────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadConversations();
    else { setConversations([]); setActiveConversationId(null); }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, []);

  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    const title = firstMessage.length > 50 ? firstMessage.slice(0, 50) + '…' : firstMessage;
    const { data, error } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title })
      .select('id')
      .single();
    if (error || !data) return null;
    await loadConversations();
    return data.id;
  }, [user, loadConversations]);

  const loadConversation = useCallback(async (conversationId: string) => {
    setActiveConversationId(conversationId);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data.map((m: SavedMessage) => ({
        id: m.id, role: m.role, content: m.content,
      })));
    }
  }, [setMessages]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    await supabase.from('conversations').delete().eq('id', conversationId);
    if (activeConversationId === conversationId) { setActiveConversationId(null); setMessages([]); }
    await loadConversations();
  }, [activeConversationId, setMessages, loadConversations]);

  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setLocalInput('');
  }, [setMessages]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setMessages([]);
    setActiveConversationId(null);
  }, [setMessages]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localInput.trim() || isLoading) return;
    const messageText = localInput.trim();
    setLocalInput('');

    let convId = activeConversationId;
    if (user && !convId) {
      convId = await createConversation(messageText);
      setActiveConversationId(convId);
    }
    append({ role: 'user', content: messageText });
  }, [localInput, isLoading, user, activeConversationId, createConversation, append]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  };

  const suggestedPrompts = [
    'What is the composition of the Geostrata team?',
    'Summarize the latest report on Middle East relations',
    'What are the core focus areas of the think tank?',
  ];

  const lastMessageId = messages[messages.length - 1]?.id;
  const lastMessageRole = messages[messages.length - 1]?.role;
  const isLastMessageStreaming = isLoading && lastMessageRole === 'assistant';

  return (
    <div className="flex h-screen bg-[#040A15] text-slate-200 font-sans selection:bg-[#004AAD]/50 overflow-hidden">

      {/* Sidebar */}
      <Sidebar
        user={user}
        conversations={conversations}
        activeId={activeConversationId}
        onNew={startNewChat}
        onSelect={loadConversation}
        onDelete={deleteConversation}
        onSignOut={handleSignOut}
        onSignIn={() => setShowAuthModal(true)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">

        {/* Header */}
        <header className="flex-shrink-0 px-6 py-4 bg-[#040A15]/90 backdrop-blur-md border-b border-white/5 z-20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="The Geostrata Logo" className="h-8 md:h-9 w-auto object-contain" />
              <div className="h-7 w-px bg-white/15" />
              <div>
                <h1 className="text-[14px] font-bold tracking-widest text-white uppercase leading-none mb-0.5">STRATA GPT</h1>
                <p className="text-[10px] text-[#4D8BFF] font-semibold tracking-wider uppercase leading-none">Intelligence Engine</p>
              </div>
            </div>
            {!user && sidebarCollapsed && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-xs text-[#4D8BFF] border border-[#004AAD]/40 px-3 py-1.5 rounded-full hover:bg-[#004AAD]/10 transition-colors"
              >
                Sign in
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto pb-40 pt-6 scroll-smooth">
          <div className="max-w-3xl mx-auto px-5 md:px-6">

            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="flex flex-col items-center justify-center min-h-[55vh]"
              >
                <div className="mb-10 w-40 drop-shadow-[0_0_40px_rgba(0,74,173,0.35)]">
                  <img src="/logo.png" alt="The Geostrata" className="w-full h-auto object-contain" />
                </div>
                <h2 className="text-3xl md:text-4xl font-medium tracking-tight mb-8 text-center text-white">
                  How can I assist your research?
                </h2>
                <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">
                  {suggestedPrompts.map((prompt, i) => (
                    <motion.button
                      key={i}
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(0,74,173,0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => append({ role: 'user', content: prompt })}
                      className="px-5 py-3 rounded-2xl border border-slate-800 bg-[#0B1221] text-[14px] text-slate-300 transition-all shadow-sm hover:border-[#004AAD]/60 hover:text-[#4D8BFF]"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
                {!user && (
                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                    className="mt-8 text-sm text-slate-500"
                  >
                    <button onClick={() => setShowAuthModal(true)} className="text-[#4D8BFF] hover:underline">Sign in</button>
                    {' '}to save your conversations
                  </motion.p>
                )}
              </motion.div>
            )}

            <div className="space-y-10 mt-2">
              <AnimatePresence initial={false}>
                {messages.map((m) => {
                  const isThisStreaming = isLastMessageStreaming && m.id === lastMessageId;
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
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
                          <div className="absolute left-3.5 top-10 bottom-2 w-px bg-slate-800 group-hover:bg-[#004AAD]/60 transition-colors duration-500" />
                          <div className="w-7 h-7 flex-shrink-0 mt-1.5 rounded-md bg-[#004AAD] flex items-center justify-center relative z-10 shadow-md shadow-[#004AAD]/30">
                            <Sparkles className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0 prose prose-invert max-w-none prose-p:leading-[1.75] prose-p:text-[15.5px] prose-li:text-[15.5px] prose-headings:font-semibold prose-headings:text-white marker:text-[#4D8BFF]">
                            <StreamingMessage content={m.content} isStreaming={isThisStreaming} />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isLoading && (messages.length === 0 || messages[messages.length - 1].role === 'user') && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-5 w-full relative">
                  <div className="w-7 h-7 flex-shrink-0 mt-1.5 rounded-md bg-slate-800 flex items-center justify-center relative z-10">
                    <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  </div>
                  <div className="flex items-center text-[15px] text-[#4D8BFF] font-medium animate-pulse">
                    Synthesizing intelligence...
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-5 w-full relative mt-4">
                  <div className="w-7 h-7 flex-shrink-0 mt-1.5 rounded-md bg-red-900/40 border border-red-800/50 flex items-center justify-center relative z-10">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1 bg-red-900/10 border border-red-800/30 px-6 py-4 rounded-3xl rounded-tl-sm text-[15px] leading-relaxed text-red-200 shadow-sm">
                    {error.message || 'An error occurred. Please try again.'}
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div className="flex-shrink-0 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#040A15] via-[#040A15]/95 to-transparent pt-12 pb-6 px-4 z-20">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={handleSend}
              className="relative flex items-center w-full bg-[#0B1221] rounded-[24px] border border-slate-800 focus-within:border-[#004AAD]/60 focus-within:ring-4 focus-within:ring-[#004AAD]/15 transition-all duration-300 shadow-xl shadow-black/20"
            >
              <input
                className="w-full h-[56px] pl-6 pr-16 text-[15px] bg-transparent border-none focus:outline-none focus:ring-0 text-slate-100 placeholder-slate-500"
                value={localInput}
                onChange={e => setLocalInput(e.target.value)}
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

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
"use client";

import { useChat } from 'ai/react';
import { useEffect, useRef, useState, memo, useCallback } from 'react';
import {
  ArrowUp, Sparkles, Loader2, Link as LinkIcon, Youtube,
  AlertCircle, LogOut, MessageSquarePlus, Trash2, User,
  PanelLeftClose, PanelLeftOpen, Pencil, Check, X, Menu,
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
  <div className="my-4 rounded-xl overflow-hidden border border-[#004AAD]/30 bg-black shadow-md w-full max-w-full aspect-video">
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
        p: ({ node, ...props }) => <div className="mb-3 last:mb-0 block" {...props} />,
        a: ({ node, ...props }) => {
          const href = String(props.href || '');
          const match = href.match(/(?:v=|\/embed\/|\.be\/)([0-9A-Za-z_-]{11})/);
          const videoId = match ? match[1] : null;
          if (videoId) return <YouTubePlayer videoId={videoId} />;
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" title={href}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 mx-0.5 border border-[#004AAD]/50 rounded-full bg-[#004AAD]/20 hover:bg-[#004AAD]/40 transition-colors no-underline relative top-[-1px]">
              {href.includes('youtube')
                ? <Youtube className="w-3 h-3 text-red-400" />
                : <LinkIcon className="w-2.5 h-2.5 text-[#4D8BFF]" />}
              <span className="text-xs font-semibold text-[#8BB4FF] truncate max-w-[120px]">{props.children}</span>
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

  useEffect(() => {
    if (isStreaming && containerRef.current) {
      const rawEl = containerRef.current.querySelector('.stream-raw') as HTMLElement | null;
      if (rawEl) rawEl.textContent = content;
    }
  }, [content, isStreaming]);

  if (isStreaming) {
    return (
      <div ref={containerRef}>
        <div className="stream-raw whitespace-pre-wrap text-[15px] leading-[1.75] text-slate-200" style={{ fontFamily: 'inherit' }}>
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        onClick={e => e.stopPropagation()}
        className="w-full sm:max-w-md bg-[#0B1221] border border-slate-800 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl"
      >
        {/* Drag handle on mobile */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-6 sm:hidden" />

        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="The Geostrata" className="h-9 w-auto mb-4 object-contain" />
          <h2 className="text-xl font-bold text-white">Sign in to STRATA GPT</h2>
          <p className="text-sm text-slate-400 mt-1">Save and access your conversations</p>
        </div>

        <button onClick={handleGoogleLogin} disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border border-slate-700 bg-[#131c2e] hover:bg-[#1a2540] active:scale-[0.98] transition-all text-white font-medium text-[15px] mb-5">
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
          </svg>
          Continue with Google
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-500">or</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-3">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" required
            className="w-full bg-[#131c2e] border border-slate-700 rounded-2xl px-4 py-3 text-[15px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#004AAD]/60 focus:ring-2 focus:ring-[#004AAD]/15 transition-all" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required
            className="w-full bg-[#131c2e] border border-slate-700 rounded-2xl px-4 py-3 text-[15px] text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#004AAD]/60 focus:ring-2 focus:ring-[#004AAD]/15 transition-all" />
          {authError && <p className="text-red-400 text-sm px-1">{authError}</p>}
          {message && <p className="text-green-400 text-sm px-1">{message}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-2xl bg-[#004AAD] hover:bg-[#003882] active:scale-[0.98] text-white font-semibold text-[15px] transition-all disabled:opacity-50">
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setAuthError(''); setMessage(''); }}
            className="text-[#4D8BFF] hover:underline">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>

        {/* ── Legal links inside auth modal ── */}
        <p className="text-center text-[11px] text-slate-600 mt-5 leading-relaxed">
          By continuing, you agree to our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">
            Terms & Conditions
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-300 underline underline-offset-2 transition-colors">
            Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR  (desktop: collapsible rail | mobile: full overlay drawer)
// ─────────────────────────────────────────────
function Sidebar({
  user, conversations, activeId, onNew, onSelect, onDelete, onRename,
  onSignOut, onSignIn, collapsed, onToggle, mobileOpen, onMobileClose,
}: {
  user: SupabaseUser | null;
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  onSignOut: () => void;
  onSignIn: () => void;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  const startRename = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setRenamingId(conv.id);
    setRenameValue(conv.title);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const commitRename = (id: string) => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== conversations.find(c => c.id === id)?.title) onRename(id, trimmed);
    setRenamingId(null);
  };

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const sidebarContent = (isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* Header — toggle button only, no logo */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/5 min-h-[56px] flex-shrink-0">
        <button
          onClick={isMobile ? onMobileClose : onToggle}
          className={`flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0 ${!collapsed || isMobile ? 'ml-auto' : 'mx-auto'}`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {isMobile ? <X className="w-4 h-4" /> : collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>
      </div>

      {/* New chat */}
      <div className="px-3 py-2.5 border-b border-white/5 flex-shrink-0">
        <button
          onClick={() => { onNew(); if (isMobile) onMobileClose(); }}
          className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl bg-[#004AAD]/15 hover:bg-[#004AAD]/25 border border-[#004AAD]/25 text-[#4D8BFF] transition-colors ${collapsed && !isMobile ? 'justify-center' : ''}`}
          title="New conversation">
          <MessageSquarePlus className="w-4 h-4 flex-shrink-0" />
          {(!collapsed || isMobile) && (
            <span className="text-[13px] font-semibold whitespace-nowrap">New Chat</span>
          )}
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 overscroll-contain">
        {(!collapsed || isMobile) && user && conversations.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-8 px-2 leading-relaxed">No saved conversations yet.<br />Start chatting!</p>
        )}
        {(!collapsed || isMobile) && !user && (
          <p className="text-xs text-slate-600 text-center py-8 px-3 leading-relaxed">Sign in to save and<br />view your conversations.</p>
        )}
        {(!collapsed || isMobile) && conversations.map(conv => (
          <div
            key={conv.id}
            onClick={() => { if (renamingId !== conv.id) { onSelect(conv.id); if (isMobile) onMobileClose(); } }}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
              activeId === conv.id ? 'bg-[#004AAD]/20 border border-[#004AAD]/30' : 'hover:bg-white/5 border border-transparent'
            }`}
          >
            {renamingId === conv.id ? (
              <div className="flex-1 flex items-center gap-1 min-w-0" onClick={e => e.stopPropagation()}>
                <input
                  ref={renameInputRef}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename(conv.id);
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="flex-1 min-w-0 bg-[#0B1221] border border-[#004AAD]/50 rounded-lg px-2 py-1 text-[12px] text-slate-100 focus:outline-none"
                />
                <button onClick={() => commitRename(conv.id)} className="p-1 rounded hover:bg-green-900/30 text-green-400">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={() => setRenamingId(null)} className="p-1 rounded hover:bg-red-900/30 text-slate-500">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate-300 truncate leading-snug">{conv.title}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{formatDate(conv.updated_at)}</p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 sm:transition-all flex-shrink-0">
                  <button onClick={e => startRename(e, conv)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300" title="Rename">
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); onDelete(conv.id); }} className="p-1.5 rounded-lg hover:bg-red-900/30 text-slate-500 hover:text-red-400" title="Delete">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/5 flex-shrink-0">
        {user ? (
          <div className={`flex items-center gap-2 ${collapsed && !isMobile ? 'justify-center' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-[#004AAD]/40 border border-[#004AAD]/50 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-[#4D8BFF] uppercase">{user.email?.[0] ?? 'U'}</span>
            </div>
            {(!collapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-slate-300 truncate">{user.email}</p>
              </div>
            )}
            <button onClick={onSignOut} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { onSignIn(); if (isMobile) onMobileClose(); }}
            className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors ${collapsed && !isMobile ? 'justify-center' : ''}`}>
            <User className="w-4 h-4 flex-shrink-0" />
            {(!collapsed || isMobile) && (
              <span className="text-[13px] font-medium whitespace-nowrap">Sign In</span>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <motion.div
        animate={{ width: collapsed ? 60 : 260 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden sm:flex relative flex-shrink-0 h-screen bg-[#070e1a] border-r border-white/5 flex-col z-30 overflow-hidden"
      >
        {sidebarContent(false)}
      </motion.div>

      {/* ── Mobile drawer overlay ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm sm:hidden"
              onClick={onMobileClose}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] bg-[#070e1a] border-r border-white/5 sm:hidden"
            >
              {sidebarContent(true)}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  const activeConvIdRef = useRef<string | null>(null);
  activeConvIdRef.current = activeConversationId;

  const { messages, append, setMessages, isLoading, error } = useChat({
    experimental_throttle: 50,
  });

  const [localInput, setLocalInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    else {
      setConversations([]);
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 640) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [localInput]);

  // ── Conversation helpers ───────────────────
  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) return;
    if (data) setConversations(data as Conversation[]);
  };

  const loadConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    const { data, error } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) return;
    if (data) {
      setMessages((data as SavedMessage[]).map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: new Date(m.created_at),
      })));
    }
  };

  const createConversation = async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    const title = firstMessage.length > 50 ? firstMessage.slice(0, 50) + '…' : firstMessage;
    const { data, error } = await supabase
      .from('conversations').insert({ user_id: user.id, title }).select('id').single();
    if (error || !data) return null;
    await loadConversations();
    return (data as { id: string }).id;
  };

  const deleteConversation = async (conversationId: string) => {
    await supabase.from('conversations').delete().eq('id', conversationId);
    if (activeConvIdRef.current === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    await loadConversations();
  };

  const renameConversation = async (conversationId: string, newTitle: string) => {
    const { error } = await supabase.from('conversations').update({ title: newTitle }).eq('id', conversationId);
    if (error) return;
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title: newTitle } : c));
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setLocalInput('');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMessages([]);
    setActiveConversationId(null);
    setConversations([]);
  };

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!localInput.trim() || isLoading) return;
    const messageText = localInput.trim();
    setLocalInput('');

    let convId = activeConvIdRef.current;
    if (user && !convId) {
      convId = await createConversation(messageText);
      if (convId) {
        setActiveConversationId(convId);
        activeConvIdRef.current = convId;
      }
    }

    append(
      { role: 'user', content: messageText },
      { options: { body: { conversationId: convId, userId: user?.id ?? null } } }
    );
  }, [localInput, isLoading, user, append]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const lastMessageId = messages[messages.length - 1]?.id;
  const lastMessageRole = messages[messages.length - 1]?.role;
  const isLastMessageStreaming = isLoading && lastMessageRole === 'assistant';

  return (
    <div className="flex h-[100dvh] bg-[#040A15] text-slate-200 font-sans selection:bg-[#004AAD]/50 overflow-hidden">

      <Sidebar
        user={user}
        conversations={conversations}
        activeId={activeConversationId}
        onNew={startNewChat}
        onSelect={loadConversation}
        onDelete={deleteConversation}
        onRename={renameConversation}
        onSignOut={handleSignOut}
        onSignIn={() => setShowAuthModal(true)}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(p => !p)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">

        {/* Header */}
        <header className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-[#040A15]/95 backdrop-blur-md border-b border-white/[0.06] z-20">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
                aria-label="Open sidebar"
              >
                <Menu className="w-4 h-4" />
              </button>
              <img src="/logo.png" alt="The Geostrata Logo" className="h-7 sm:h-9 w-auto object-contain" />
              <div className="h-6 w-px bg-white/15" />
              <div>
                <h1 className="text-[12px] sm:text-[14px] font-bold tracking-widest text-white uppercase leading-none mb-0.5">STRATA GPT</h1>
                <p className="text-[9px] sm:text-[10px] text-[#4D8BFF] font-semibold tracking-wider uppercase leading-none">Intelligence Engine</p>
              </div>
            </div>
            {!user && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-xs text-[#4D8BFF] border border-[#004AAD]/40 px-3 py-1.5 rounded-full hover:bg-[#004AAD]/10 active:scale-95 transition-all whitespace-nowrap">
                Sign in
              </button>
            )}
          </div>
        </header>

        {/* ── EMPTY STATE ── */}
        {messages.length === 0 && (
          <div className="flex-1 relative overflow-hidden">
            <div
              className="absolute left-1/2 w-full max-w-2xl px-4 sm:px-6"
              style={{ top: '45%', transform: 'translate(-50%, -50%)' }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="flex flex-col items-center"
              >
                <h2 className="text-2xl sm:text-[28px] font-semibold tracking-tight text-center text-white mb-6">
                  How can I assist your research?
                </h2>

                <div className="w-full">
                  <div className="flex items-center w-full bg-[#0B1221] rounded-2xl border border-slate-800 focus-within:border-[#004AAD]/60 focus-within:ring-4 focus-within:ring-[#004AAD]/10 transition-all duration-300 shadow-xl shadow-black/30 px-5 sm:px-6 gap-3" style={{ height: '56px' }}>
                    <textarea
                      ref={inputRef}
                      rows={1}
                      className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-[14.5px] sm:text-[15px] text-slate-100 placeholder-slate-500 resize-none leading-none min-h-[22px] max-h-[22px] overflow-hidden self-center"
                      value={localInput}
                      onChange={e => setLocalInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Query the geopolitical database…"
                      disabled={isLoading}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                    />
                    <button
                      onClick={() => handleSend()}
                      disabled={isLoading || !localInput.trim()}
                      className="flex-shrink-0 p-2 sm:p-2.5 rounded-full bg-[#004AAD] text-white disabled:opacity-30 disabled:bg-slate-700 hover:bg-[#003882] active:scale-95 transition-all flex items-center justify-center shadow-md shadow-[#004AAD]/30 disabled:shadow-none"
                    >
                      {isLoading
                        ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                        : <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />}
                    </button>
                  </div>

                  {/* ── Disclaimer + legal links ── */}
                  <div className="flex flex-col items-center gap-1 mt-2.5">
                    <span className="text-[9px] sm:text-[10px] text-slate-600 font-semibold tracking-widest uppercase">
                      Strata GPT can make mistakes. Verify critical intel.
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-slate-700">
                      <a href="/privacy-policy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
                      <span>·</span>
                      <a href="/terms" className="hover:text-slate-400 transition-colors">Terms & Conditions</a>
                    </div>
                  </div>
                </div>

                {!user && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                    className="mt-5 text-sm text-slate-500 text-center">
                    <button onClick={() => setShowAuthModal(true)} className="text-[#4D8BFF] hover:underline">Sign in</button>
                    {' '}to save your conversations
                  </motion.p>
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* ── CHAT STATE ── */}
        {messages.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="max-w-3xl mx-auto px-4 sm:px-6">
                <div className="space-y-6 sm:space-y-8 pt-6 sm:pt-8">
                  <AnimatePresence initial={false}>
                    {messages.map((m) => {
                      const isThisStreaming = isLastMessageStreaming && m.id === lastMessageId;
                      return (
                        <motion.div key={m.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, ease: 'easeOut' }}
                          className="w-full flex flex-col group"
                        >
                          {m.role === 'user' ? (
                            <div className="flex justify-end w-full">
                              <div className="max-w-[88%] sm:max-w-[78%] bg-[#004AAD]/15 border border-[#004AAD]/30 px-4 sm:px-6 py-3 sm:py-4 rounded-[20px] rounded-tr-[6px] text-[14.5px] sm:text-[15px] leading-relaxed text-blue-50 shadow-sm">
                                {m.content}
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-3 sm:gap-5 w-full relative">
                              <div className="absolute left-[13px] top-9 bottom-2 w-px bg-slate-800/80 group-hover:bg-[#004AAD]/50 transition-colors duration-500" />
                              <div className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 mt-1.5 rounded-md bg-[#004AAD] flex items-center justify-center relative z-10 shadow-md shadow-[#004AAD]/30">
                                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                              </div>
                              <div className="flex-1 min-w-0 prose prose-invert max-w-none prose-p:leading-[1.75] prose-p:text-[14.5px] sm:prose-p:text-[15.5px] prose-li:text-[14.5px] sm:prose-li:text-[15.5px] prose-headings:font-semibold prose-headings:text-white marker:text-[#4D8BFF]">
                                <StreamingMessage content={m.content} isStreaming={isThisStreaming} />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {isLoading && messages[messages.length - 1].role === 'user' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 sm:gap-5 w-full relative">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 mt-1.5 rounded-md bg-slate-800 flex items-center justify-center relative z-10">
                        <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                      </div>
                      <div className="flex items-center text-[14px] sm:text-[15px] text-[#4D8BFF] font-medium animate-pulse">
                        Synthesizing intelligence…
                      </div>
                    </motion.div>
                  )}

                  {error && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 sm:gap-5 w-full mt-2">
                      <div className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 mt-1.5 rounded-md bg-red-900/40 border border-red-800/50 flex items-center justify-center z-10">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                      </div>
                      <div className="flex-1 bg-red-900/10 border border-red-800/30 px-4 sm:px-6 py-3 sm:py-4 rounded-[20px] rounded-tl-[6px] text-[14px] sm:text-[15px] leading-relaxed text-red-200 shadow-sm">
                        {error.message || 'An error occurred. Please try again.'}
                      </div>
                    </motion.div>
                  )}

                  <div ref={bottomRef} className="h-1 pb-48 sm:pb-52" />
                </div>
              </div>
            </div>

            {/* Sticky bottom input */}
            <div className="flex-shrink-0 absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#040A15] via-[#040A15]/98 to-transparent pt-12 pb-5 sm:pb-7 px-3 sm:px-6 z-20">
              <div className="max-w-2xl mx-auto">
                <div className="relative flex items-end w-full bg-[#0B1221] rounded-[26px] sm:rounded-[28px] border border-slate-800 focus-within:border-[#004AAD]/60 focus-within:ring-4 focus-within:ring-[#004AAD]/10 transition-all duration-300 shadow-xl shadow-black/30 px-5 sm:px-6 py-3.5 sm:py-4 gap-3">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-[14.5px] sm:text-[15px] text-slate-100 placeholder-slate-500 resize-none leading-relaxed min-h-[26px] max-h-[200px] overflow-y-auto"
                    value={localInput}
                    onChange={e => setLocalInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Query the geopolitical database…"
                    disabled={isLoading}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || !localInput.trim()}
                    className="flex-shrink-0 mb-0.5 p-2 sm:p-2.5 rounded-full bg-[#004AAD] text-white disabled:opacity-30 disabled:bg-slate-700 hover:bg-[#003882] active:scale-95 transition-all flex items-center justify-center shadow-md shadow-[#004AAD]/30 disabled:shadow-none"
                  >
                    {isLoading
                      ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      : <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />}
                  </button>
                </div>

                {/* ── Disclaimer + legal links ── */}
                <div className="flex flex-col items-center gap-1 mt-2.5">
                  <span className="text-[9px] sm:text-[10px] text-slate-600 font-semibold tracking-widest uppercase">
                    Strata GPT can make mistakes. Verify critical intel.
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-700">
                    <a href="/privacy-policy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
                    <span>·</span>
                    <a href="/terms" className="hover:text-slate-400 transition-colors">Terms & Conditions</a>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
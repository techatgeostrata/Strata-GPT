import React from 'react';

interface CitationCardProps {
  href?: string;
  children?: React.ReactNode;
}

export default function CitationCard({ href, children }: CitationCardProps) {
  if (!href) return <span className="text-blue-500">{children}</span>;

  const isVideo = href.includes('youtube.com') || href.includes('youtu.be');

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mx-1 border border-gray-200 dark:border-gray-700/60 rounded-full bg-gray-50 dark:bg-[#2a2a2a] hover:bg-gray-100 dark:hover:bg-[#333333] transition-colors no-underline group relative top-[-2px]"
    >
      {isVideo ? (
        <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500 transition-colors" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )}
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors truncate max-w-[140px]">
        {children}
      </span>
    </a>
  );
}
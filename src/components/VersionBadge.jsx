import React from 'react';

/* eslint-disable no-undef */
const VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '?';
const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined__' ? __BUILD_DATE__ : null;

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome',
    }).format(new Date(iso));
  } catch { return null; }
}

export default function VersionBadge({ className = '' }) {
  const date = formatDate(BUILD_DATE);
  return (
    <div className={`flex items-center justify-center gap-1.5 text-slate-400 dark:text-slate-600 select-none ${className}`}>
      <span className="font-mono text-[10px] font-bold tracking-widest uppercase">BOB v{VERSION}</span>
      {date && (
        <>
          <span className="text-slate-300 dark:text-slate-700">&middot;</span>
          <span className="text-[10px]">build {date}</span>
        </>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function TopBar() {
  const { lang, setLang, t, worker } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const isDashboard = pathname.startsWith('/home') || pathname.startsWith('/result');

  return (
    <header className="top-bar">
      <div className="top-bar-left">
        {isDashboard && (
          <div className="user-avatar-circle" title={worker?.name || 'Worker'}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4.5" fill="#D97706" />
              <path d="M4 20C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 20" fill="#B45309" />
            </svg>
          </div>
        )}
        <h1 
          className="top-bar-title" 
          onClick={() => router.push('/')} 
          style={{ cursor: 'pointer', userSelect: 'none' }}
        >
          SkillProof
        </h1>
      </div>

      <button 
        className="lang-switch-pill" 
        onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
        type="button"
        aria-label="Switch language"
      >
        <Globe size={14} />
        <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
      </button>
    </header>
  );
}

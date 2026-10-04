'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Briefcase, ArrowRight, ChevronDown } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function WelcomePage() {
  const { setWorker } = useApp();
  const router = useRouter();
  const [showWorkerForm, setShowWorkerForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWorkerSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (!name.trim() || cleanPhone.length !== 10) {
      setError('Please enter your full name and a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: cleanPhone })
      });
      const data = await res.json();
      if (res.ok && data.worker) {
        setWorker(data.worker);
        router.push(`/home?workerId=${data.worker.id}`);
      } else {
        setError(data.error || 'Failed to continue. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="content" style={{ justifyContent: 'space-between', minHeight: 'calc(100vh - 65px)' }}>
      {!showWorkerForm ? (
        /* SCREEN 1: WELCOME SCREEN */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
          {/* Isometric Passport & Toolbox SVG Illustration */}
          <div style={{ margin: '1.25rem 0 1.5rem', width: '100%', maxWidth: '240px', display: 'flex', justifyContent: 'center' }}>
            <svg width="220" height="150" viewBox="0 0 220 150" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Drop Shadow */}
              <ellipse cx="105" cy="125" rx="80" ry="18" fill="#E2E8F0" />
              
              {/* Isometric Tablet Base */}
              <path d="M40 90 L115 130 L165 95 L90 55 Z" fill="#1E293B" />
              <path d="M40 90 L40 98 L115 138 L115 130 Z" fill="#0F172A" />
              <path d="M115 130 L115 138 L165 103 L165 95 Z" fill="#334155" />
              
              {/* Tablet Screen */}
              <path d="M46 89 L113 125 L159 93 L92 59 Z" fill="#E0F2FE" />
              <path d="M55 87 L110 117 L145 92 L90 64 Z" fill="#F8FAFC" />
              <line x1="68" y1="84" x2="110" y2="106" stroke="#93C5FD" strokeWidth="3" strokeLinecap="round" />
              <line x1="75" y1="94" x2="105" y2="110" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

              {/* ID Badge / Clipboard */}
              <g transform="translate(10, 0)">
                {/* Board shadow */}
                <rect x="76" y="24" width="48" height="66" rx="6" transform="rotate(-6 76 24)" fill="#0F172A" opacity="0.1" />
                {/* Board */}
                <rect x="74" y="22" width="48" height="66" rx="6" transform="rotate(-6 74 22)" fill="#FFFFFF" stroke="#002D62" strokeWidth="2" />
                {/* Clip */}
                <rect x="90" y="16" width="16" height="8" rx="2" transform="rotate(-6 90 16)" fill="#FFC72C" stroke="#B45309" strokeWidth="1" />
                <circle cx="97" cy="17" r="2" fill="#FFFFFF" />
                {/* Avatar on card */}
                <circle cx="96" cy="42" r="10" fill="#E2E8F0" stroke="#002D62" strokeWidth="1.5" />
                <circle cx="96" cy="39" r="4" fill="#D97706" />
                <path d="M90 48 C90 44 93 43 96 43 C99 43 102 44 102 48" stroke="#002D62" strokeWidth="1.5" fill="#B45309" />
                {/* Text lines on card */}
                <line x1="84" y1="60" x2="108" y2="57.5" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                <line x1="86" y1="68" x2="106" y2="66" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <line x1="88" y1="76" x2="104" y2="74.5" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Yellow Toolbox */}
              <g transform="translate(130, 68)">
                {/* Box body */}
                <path d="M5 25 L45 42 L65 24 L25 8 Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
                <path d="M5 25 L5 48 L45 65 L45 42 Z" fill="#D97706" stroke="#B45309" strokeWidth="1.5" />
                <path d="M45 42 L45 65 L65 47 L65 24 Z" fill="#B45309" stroke="#92400E" strokeWidth="1.5" />
                {/* Toolbox Lid Top */}
                <path d="M5 25 L25 8 L65 24 L45 42 Z" fill="#FFC72C" />
                {/* Box Handle */}
                <path d="M30 14 L42 20" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
                {/* Latches */}
                <rect x="23" y="32" width="6" height="8" rx="1" fill="#475569" />
                <rect x="42" y="27" width="5" height="7" rx="1" fill="#334155" />
              </g>
            </svg>
          </div>

          <h2 className="screen-title" style={{ color: '#002D62', fontSize: '24px', fontWeight: '800' }}>
            SkillProof: Your Digital Skill Passport.
          </h2>
          <p className="screen-subtitle" style={{ maxWidth: '320px', margin: '0.5rem auto 2rem' }}>
            Validate, showcase, and get recognized for your trade skills. Fast, secure, and verifiable.
          </p>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <button 
              className="btn-primary" 
              onClick={() => setShowWorkerForm(true)}
              type="button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
                <path d="M8 3h8"></path>
                <path d="M6 6h12"></path>
              </svg>
              <span>I am a Worker</span>
            </button>

            <button 
              className="btn-secondary" 
              onClick={() => router.push('/assessor')}
              type="button"
            >
              <Briefcase size={20} color="#002D62" />
              <span>I am an Assessor</span>
            </button>
          </div>

          <p className="footer-text" style={{ marginTop: '3rem' }}>
            Built for the SkillProof Hackathon Team.
          </p>
        </div>
      ) : (
        /* SCREEN 2: WORKER LOGIN */
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', flex: 1, justifyContent: 'space-between' }}>
          <div>
            <div style={{ textAlign: 'center', margin: '1rem 0 2rem' }}>
              <h2 className="screen-title" style={{ fontSize: '24px', fontWeight: '800', color: '#002D62' }}>
                Welcome, Worker.
              </h2>
              <p className="screen-subtitle" style={{ margin: '0.4rem 0 0' }}>
                Create your profile or continue to dashboard.
              </p>
            </div>

            <form onSubmit={handleWorkerSubmit} style={{ width: '100%' }}>
              {/* Full Name Input */}
              <div className="input-group">
                <div className="custom-input-wrapper">
                  <span className="input-icon-left">
                    <User size={18} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    className="custom-input-field" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    autoFocus
                  />
                </div>
              </div>

              {/* Mobile Number Input */}
              <div className="input-group" style={{ marginBottom: '1.75rem' }}>
                <div className="custom-input-wrapper">
                  <div className="flag-dropdown">
                    <span style={{ fontSize: '18px' }}>🇮🇳</span>
                    <ChevronDown size={14} color="#64748B" />
                  </div>
                  <input 
                    type="tel" 
                    placeholder="Mobile Number" 
                    className="custom-input-field" 
                    value={phone} 
                    maxLength={10}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} 
                    required 
                  />
                </div>
                <p className="input-caption">10-digit phone number</p>
              </div>

              {error && (
                <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '13px', fontWeight: '500', marginBottom: '1rem', textAlign: 'center' }}>
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={loading}
                >
                  <span>{loading ? 'Please wait...' : 'Get Started'}</span>
                  <ArrowRight size={18} />
                </button>

                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setShowWorkerForm(false)}
                >
                  Back
                </button>
              </div>
            </form>
          </div>

          <p className="footer-text" style={{ padding: '1rem 0' }}>
            By signing up, you agree to our{' '}
            <span className="footer-link" style={{ cursor: 'pointer' }}>Terms of Service</span>
            {' '}&{' '}
            <span className="footer-link" style={{ cursor: 'pointer' }}>Privacy Policy</span>.
          </p>
        </div>
      )}
    </div>
  );
}

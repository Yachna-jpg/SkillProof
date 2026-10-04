'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, Lock, Wrench, Shirt, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';

function HomeContent() {
  const { lang, setLang, worker, setAssessment, fetchWorkerById } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workerIdFromUrl = searchParams.get('workerId');

  const [loading, setLoading] = useState(false);
  const [lockedNotice, setLockedNotice] = useState('');

  useEffect(() => {
    if (!worker && workerIdFromUrl) {
      fetchWorkerById(workerIdFromUrl);
    } else if (!worker && !workerIdFromUrl) {
      router.push('/');
    }
  }, [worker, workerIdFromUrl, fetchWorkerById, router]);

  const handleStartElectrician = async () => {
    setLoading(true);
    try {
      const activeWorkerId = worker?.id || workerIdFromUrl;
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workerId: activeWorkerId, trade: 'electrician', language: lang }),
      });

      if (!res.ok) throw new Error("Start test failed");
      const data = await res.json();
      if (data.assessment) {
        setAssessment(data.assessment);
        router.push(`/test?assessmentId=${data.assessment.id}`);
      } else {
        throw new Error("No assessment returned");
      }
    } catch (err) {
      console.error("Start Test Error:", err);
      alert("Failed to start assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLockedTradeClick = (tradeName) => {
    setLockedNotice(`${tradeName} assessment is coming soon!`);
    setTimeout(() => setLockedNotice(''), 3000);
  };

  const displayName = worker?.name || 'Worker';

  return (
    <div className="content" style={{ gap: '1.5rem', paddingBottom: '2.5rem' }}>
      {/* Namaste Section */}
      <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#002D62' }}>
          Namaste, {displayName}!
        </h2>
      </div>

      {/* Choose Language Section */}
      <div style={{ width: '100%' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#002D62', marginBottom: '0.75rem' }}>
          Choose Language
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {/* Hindi button */}
          <button
            type="button"
            onClick={() => setLang('hi')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.65rem 1rem',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: lang === 'hi' ? '#002D62' : '#FFFFFF',
              color: lang === 'hi' ? '#FFFFFF' : '#002D62',
              border: '1.5px solid #002D62',
              boxShadow: lang === 'hi' ? '0 3px 8px rgba(0, 45, 98, 0.2)' : 'none',
            }}
          >
            <Globe size={16} />
            <span>हिंदी</span>
          </button>

          {/* English button */}
          <button
            type="button"
            onClick={() => setLang('en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.65rem 1rem',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: lang === 'en' ? '#002D62' : '#FFFFFF',
              color: lang === 'en' ? '#FFFFFF' : '#002D62',
              border: '1.5px solid #002D62',
              boxShadow: lang === 'en' ? '0 3px 8px rgba(0, 45, 98, 0.2)' : 'none',
            }}
          >
            <Globe size={16} />
            <span>English</span>
          </button>
        </div>
      </div>

      {/* Select Your Trade Section */}
      <div style={{ width: '100%' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#002D62', marginBottom: '0.85rem' }}>
          Select Your Trade
        </h3>

        {lockedNotice && (
          <div style={{ background: '#FEF3C7', color: '#B45309', padding: '0.6rem', borderRadius: '8px', fontSize: '13px', fontWeight: '600', textAlign: 'center', marginBottom: '0.75rem', animation: 'pulse 1s' }}>
            🔒 {lockedNotice}
          </div>
        )}

        {/* Active Card: Electrician */}
        <div
          onClick={handleStartElectrician}
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '16px',
            padding: '1.25rem',
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
            marginBottom: '1rem',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#002D62';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 45, 98, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#CBD5E1';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
          }}
        >
          {/* Lightning Bolt Icon */}
          <div style={{ marginBottom: '0.75rem' }}>
            <svg width="28" height="32" viewBox="0 0 24 28" fill="none">
              <path d="M13 1L3 16H12L11 27L21 12H12L13 1Z" fill="#FFC72C" stroke="#D97706" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          
          <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#0F172A', margin: '0 0 0.4rem 0' }}>
            Electrician
          </h4>
          
          <span 
            style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#002D62', 
              textDecoration: 'underline',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            {loading ? 'Starting...' : 'Start Assessment'}
            <ArrowRight size={14} />
          </span>
        </div>

        {/* Locked Cards Row: Plumber & Tailor */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
          {/* Plumber Card */}
          <div
            onClick={() => handleLockedTradeClick('Plumber')}
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '16px',
              padding: '1rem',
              cursor: 'not-allowed',
              opacity: 0.85,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '125px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* Pipe / Wrench Icon */}
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EEF2F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wrench size={20} color="#94A3B8" />
              </div>
              <span style={{ background: '#E2E8F0', color: '#64748B', fontSize: '11px', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '10px' }}>
                Locked
              </span>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#64748B', margin: '0 0 0.15rem 0' }}>
                Plumber
              </h4>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                Coming Soon
              </p>
            </div>
          </div>

          {/* Tailor Card */}
          <div
            onClick={() => handleLockedTradeClick('Tailor')}
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '16px',
              padding: '1rem',
              cursor: 'not-allowed',
              opacity: 0.85,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '125px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {/* Shirt / Sewing Icon */}
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#EEF2F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shirt size={20} color="#94A3B8" />
              </div>
              <span style={{ background: '#E2E8F0', color: '#64748B', fontSize: '11px', fontWeight: '700', padding: '0.2rem 0.5rem', borderRadius: '10px' }}>
                Locked
              </span>
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#64748B', margin: '0 0 0.15rem 0' }}>
                Tailor
              </h4>
              <p style={{ fontSize: '12px', color: '#94A3B8', margin: 0 }}>
                Coming Soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="content"><p>Loading dashboard...</p></div>}>
      <HomeContent />
    </Suspense>
  );
}

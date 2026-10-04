'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, LogOut, ArrowRight, RotateCw, CheckCircle2, Clock } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function AssessorPage() {
  const { t, assessorToken, setAssessorToken } = useApp();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [filter, setFilter] = useState('All');

  const fetchAssessments = useCallback(async () => {
    if (!assessorToken) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/assessments/all?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data = await res.json();
      setAssessments(data.assessments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  }, [assessorToken]);

  useEffect(() => {
    if (assessorToken) {
      fetchAssessments();
    }
  }, [assessorToken, fetchAssessments]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/assessor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        setAssessorToken(data.token);
        setError('');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (!assessorToken) {
    return (
      <div className="content" style={{ justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#EFF6FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', border: '1.5px solid #002D62' }}>
            <Lock size={26} color="#002D62" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#002D62', margin: '0 0 0.35rem 0' }}>
            {t.assessor_title}
          </h2>
          <p style={{ fontSize: '14px', color: '#666666', margin: 0 }}>
            Enter assessor security password to continue
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="Password (skill123)" 
            className="select-box" 
            required
            autoFocus
          />
          {error && (
            <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.65rem 0.85rem', borderRadius: '8px', fontSize: '13px', fontWeight: '500', textAlign: 'center' }}>
              {error}
            </div>
          )}
          <button className="btn-primary" type="submit" disabled={loading}>
            <span>{loading ? 'Logging in...' : 'Login to Dashboard'}</span>
            <ArrowRight size={18} />
          </button>
          <button className="btn-secondary" type="button" onClick={() => router.push('/')}>
            Back to Home
          </button>
        </form>
      </div>
    );
  }

  const waitingCount = assessments.filter(a => a.status === 'waiting_for_assessor').length;
  const approvedCount = assessments.filter(a => a.status === 'approved').length;

  const filtered = assessments.filter(a => {
    if (filter === 'Waiting') return a.status === 'waiting_for_assessor';
    if (filter === 'Approved') return a.status === 'approved';
    return true;
  });

  return (
    <div className="content" style={{ width: '100%', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#002D62' }}>{t.assessor_title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button 
            type="button"
            onClick={fetchAssessments} 
            disabled={isRefreshing}
            style={{ 
              background: '#F1F5F9', 
              border: '1.5px solid #CBD5E1', 
              borderRadius: '20px',
              padding: '0.35rem 0.75rem',
              color: '#002D62', 
              cursor: 'pointer', 
              fontWeight: '700', 
              fontSize: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.3rem' 
            }}
            title="Refresh assessments list"
          >
            <RotateCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button 
            type="button"
            onClick={() => setAssessorToken(null)} 
            style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
      
      {/* Filter Tabs with counts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', width: '100%', marginBottom: '0.5rem' }}>
        {[
          { key: 'All', label: `All (${assessments.length})` },
          { key: 'Waiting', label: `Waiting (${waitingCount})` },
          { key: 'Approved', label: `Approved (${approvedCount})` }
        ].map(tab => (
          <button 
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            style={{ 
              padding: '0.55rem 0.5rem', 
              fontSize: '13px', 
              fontWeight: '600',
              fontFamily: 'inherit',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              backgroundColor: filter === tab.key ? '#002D62' : '#FFFFFF',
              color: filter === tab.key ? '#FFFFFF' : '#002D62',
              border: '1.5px solid #002D62',
              boxShadow: filter === tab.key ? '0 3px 8px rgba(0, 45, 98, 0.2)' : 'none'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
        {filtered.map(a => {
          const isApproved = a.status === 'approved';

          return (
            <div 
              key={a.id} 
              className="card" 
              onClick={() => router.push(`/assessor/review/${a.id}`)} 
              style={{ 
                cursor: 'pointer', 
                position: 'relative', 
                margin: 0, 
                transition: 'all 0.2s ease', 
                border: isApproved ? '1.5px solid #10B981' : '1.5px solid #CBD5E1',
                borderLeft: isApproved ? '5px solid #10B981' : (a.needsCheck ? '5px solid #DC2626' : '5px solid #002D62')
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#002D62'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = isApproved ? '#10B981' : '#CBD5E1'}
            >
              {a.needsCheck && !isApproved && (
                <div style={{ position: 'absolute', top: '-10px', right: '12px', background: '#DC2626', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '11px', fontWeight: '700', boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)' }}>
                  Check first
                </div>
              )}
              {isApproved && (
                <div style={{ position: 'absolute', top: '-10px', right: '12px', background: '#10B981', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '11px', fontWeight: '700', boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <CheckCircle2 size={12} />
                  <span>Approved</span>
                </div>
              )}
              <h3 style={{ margin: '0 0 0.35rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '16px', fontWeight: '700', color: '#0F172A' }}>{a.workerName || 'Worker'}</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#002D62' }}>{a.score ?? 0}/100</span>
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B', marginBottom: '0.25rem' }}>
                <span>📞 {a.workerPhone || 'N/A'}</span>
                <span>🌐 {a.workerLanguage?.toUpperCase() || 'EN'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748B' }}>
                <span style={{ fontWeight: '500' }}>{a.trade?.toUpperCase() || 'TRADE'} • <b style={{ color: a.level === 'Expert' ? '#10B981' : (a.level === 'Intermediate' ? '#002D62' : '#F59E0B') }}>{a.level || 'Beginner'}</b></span>
                <span style={{ color: isApproved ? '#16A34A' : '#D97706', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  {isApproved ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                  {isApproved ? 'Approved' : 'Waiting'}
                </span>
              </div>
              {a.assessor_comment && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed #E2E8F0', fontSize: '12px', color: '#475569', fontStyle: 'italic' }}>
                  "{a.assessor_comment}"
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <p style={{ textAlign: 'center', color: '#94A3B8', margin: '2rem 0' }}>No assessments found in this view.</p>}
      </div>
    </div>
  );
}

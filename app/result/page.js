'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, RotateCcw, CheckCircle, Clock, Award, Camera, RotateCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';

function ResultContent() {
  const { t, assessment } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentIdFromUrl = searchParams.get('assessmentId');
  const activeAssessmentId = assessment?.id || assessmentIdFromUrl;

  const [assessmentData, setAssessmentData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (isManual = false) => {
    if (!activeAssessmentId) return;
    if (isManual) setIsRefreshing(true);

    try {
      const res = await fetch(`/api/result/${activeAssessmentId}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      if (!res.ok) throw new Error("Failed to load result");
      const d = await res.json();
      if (d.assessment) {
        setAssessmentData(d.assessment);
        setAnswers(d.answers || []);
        setProofs(d.proofs || []);
      }
    } catch (err) {
      console.error("Result fetch error:", err);
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [activeAssessmentId]);

  useEffect(() => {
    if (!activeAssessmentId) {
      router.push('/');
      return;
    }

    loadData();

    // Live polling: poll every 3 seconds to catch live assessor approvals
    const interval = setInterval(() => {
      loadData();
    }, 3000);

    return () => clearInterval(interval);
  }, [activeAssessmentId, router, loadData]);

  if (loading) {
    return (
      <div className="content" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#002D62', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '600', color: '#002D62' }}>Loading your results...</p>
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="content">
        <p style={{ textAlign: 'center', margin: '2rem 0 1rem' }}>Assessment not found.</p>
        <button className="btn-primary" onClick={() => router.push('/')}>Go Home</button>
      </div>
    );
  }

  const score = assessmentData.total_score ?? 0;
  const level = assessmentData.level || 'Beginner';
  const displayStatus = assessmentData.status || 'waiting_for_assessor';
  const isApproved = displayStatus === 'approved';

  let levelColor = '#F59E0B'; // Amber for Beginner
  if (level === 'Intermediate' || level === 'Skilled') levelColor = '#002D62'; // Navy
  if (level === 'Expert') levelColor = '#10B981'; // Green

  return (
    <div className="content" style={{ gap: '1.25rem' }}>
      <h2 style={{ textAlign: 'center', fontSize: '22px', fontWeight: '800', color: '#002D62', margin: 0 }}>
        {t.result_title}
      </h2>
      
      {/* Score Badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.5rem 0' }}>
        <div 
          style={{ 
            width: '120px', 
            height: '120px', 
            borderRadius: '50%', 
            border: `6px solid ${levelColor}`, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            fontSize: '32px', 
            fontWeight: '800', 
            color: '#002D62',
            boxShadow: '0 4px 16px rgba(0, 45, 98, 0.1)'
          }}
        >
          {score}/100
        </div>
        <div style={{ background: levelColor, color: '#FFFFFF', padding: '0.3rem 1.1rem', borderRadius: '20px', marginTop: '-14px', fontWeight: '700', fontSize: '13px', zIndex: 1, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}>
          {t[level.toLowerCase()] || level}
        </div>
      </div>

      {/* Approval Status Banner */}
      <div 
        style={{ 
          background: isApproved ? '#D1FAE5' : '#FEF3C7', 
          color: isApproved ? '#065F46' : '#B45309', 
          border: isApproved ? '1.5px solid #10B981' : '1.5px solid #F59E0B',
          padding: '0.85rem 1rem', 
          borderRadius: '14px', 
          width: '100%', 
          textAlign: 'center', 
          fontWeight: '700', 
          fontSize: '14px',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem',
          boxShadow: isApproved ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
        }}
      >
        {isApproved ? <CheckCircle size={20} color="#059669" /> : <Clock size={20} />}
        <span>{isApproved ? (t.approved_assessor || 'Approved by Assessor') : (t.waiting_assessor || 'Waiting for assessor approval')}</span>
      </div>

      {/* Manual refresh button while waiting */}
      {!isApproved && (
        <button 
          type="button" 
          onClick={() => loadData(true)} 
          disabled={isRefreshing}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#002D62', 
            fontSize: '13px', 
            fontWeight: '600', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '0.35rem', 
            margin: '-0.5rem auto 0 auto' 
          }}
        >
          <RotateCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>{isRefreshing ? 'Checking status...' : 'Check Status Now'}</span>
        </button>
      )}

      {/* Assessor Feedback Note if Approved */}
      {isApproved && assessmentData.assessor_comment && (
        <div 
          className="card" 
          style={{ 
            margin: 0, 
            background: '#F0FDF4', 
            border: '1.5px solid #86EFAC', 
            borderLeft: '5px solid #16A34A',
            padding: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
            <Award size={16} color="#166534" />
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#166534' }}>
              Assessor Feedback / मूल्यांकनकर्ता की टिप्पणी
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#14532D', fontStyle: 'italic' }}>
            "{assessmentData.assessor_comment}"
          </p>
          {assessmentData.approved_time && (
            <div style={{ marginTop: '0.4rem', fontSize: '11px', color: '#15803D' }}>
              Approved on {new Date(assessmentData.approved_time).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Answer list */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {answers.filter(a => a.question_id).map(ans => (
          <div key={ans.id} className="card" style={{ padding: '0.9rem 1rem', margin: 0, borderLeft: '4px solid #002D62' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14px', marginBottom: '0.25rem', color: '#0F172A' }}>
              <span>{ans.question_id}</span>
              <span style={{ color: '#002D62' }}>
                {ans.final_marks !== null && ans.final_marks !== undefined ? ans.final_marks : (ans.ai_marks || 0)}/20
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', fontStyle: 'italic', margin: 0 }}>
              "{ans.reason || 'Assessed by AI'}"
            </p>
          </div>
        ))}

        {/* Practical photo proof in result */}
        {proofs.map(p => (
          <div key={p.id} className="card" style={{ padding: '0.9rem 1rem', margin: 0, borderLeft: '4px solid #8B5CF6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '14px', marginBottom: '0.25rem', color: '#0F172A' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Camera size={15} color="#8B5CF6" />
                <span>Practical Work Photo</span>
              </span>
              <span style={{ color: '#002D62' }}>
                {p.final_marks !== null && p.final_marks !== undefined ? p.final_marks : (p.ai_marks || 0)}/20
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', fontStyle: 'italic', margin: 0 }}>
              {p.notes || (p.skipped ? 'Skipped practical photo' : 'Practical photo verified')}
            </p>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', marginTop: 'auto' }}>
        <button type="button" className="btn-secondary" onClick={() => window.print()}>
          <Download size={18} />
          <span>{t.download_report}</span>
        </button>

        <button type="button" className="btn-primary" onClick={() => router.push('/')}>
          <RotateCcw size={18} />
          <span>{t.take_test_again}</span>
        </button>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="content"><p>Loading...</p></div>}>
      <ResultContent />
    </Suspense>
  );
}

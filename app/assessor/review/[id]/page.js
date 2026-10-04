'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, Award, AlertCircle, Camera } from 'lucide-react';

export default function ReviewTestPage() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();

  const [data, setData] = useState(null);
  const [finalAnswers, setFinalAnswers] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/assessments/${id}?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(d => {
        setData(d);
        if (d.assessment) {
          setIsApproved(d.assessment.status === 'approved');
          if (d.assessment.assessor_comment) {
            setComment(d.assessment.assessor_comment);
          }
        }
        const editableAns = (d.answers || []).map(a => ({
          id: a.id,
          questionId: a.questionId,
          marks: a.marks !== null && a.marks !== undefined ? Number(a.marks) : (Number(a.ai_marks) || 0),
          skipped: a.skipped,
          isProof: a.isProof
        }));
        setFinalAnswers(editableAns);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="content" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#002D62', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '600', color: '#002D62' }}>Loading assessment details...</p>
      </div>
    );
  }

  if (!data || !data.assessment) {
    return (
      <div className="content">
        <p style={{ textAlign: 'center', margin: '2rem 0 1rem' }}>Assessment not found.</p>
        <button className="btn-primary" onClick={() => router.push('/assessor')}>Back to Assessor List</button>
      </div>
    );
  }

  const handleMarkChange = (ansId, newMarks) => {
    const val = Math.max(0, Math.min(20, Number(newMarks) || 0));
    setFinalAnswers(prev => prev.map(a => a.id === ansId ? { ...a, marks: val } : a));
  };

  const calculateLiveScore = () => {
    let t = 0;
    finalAnswers.forEach(fa => {
      t += Number(fa.marks) || 0;
    });
    return t;
  };

  const liveScore = calculateLiveScore();
  let liveLevel = "Beginner";
  if (liveScore >= 40 && liveScore < 70) liveLevel = "Intermediate";
  if (liveScore >= 70) liveLevel = "Expert";

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/assessments/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalAnswers, comment })
      });
      const resultData = await res.json();
      if (res.ok && resultData.success) {
        setIsApproved(true);
        router.refresh();
        router.push('/assessor');
      } else {
        alert(resultData.error || "Failed to approve assessment.");
      }
    } catch (err) {
      console.error(err);
      alert("Network error approving assessment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content" style={{ gap: '1.25rem' }}>
      {/* Status banner if already approved */}
      {isApproved && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '0.75rem 1rem', borderRadius: '12px', width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '14px', border: '1.5px solid #10B981' }}>
          <CheckCircle size={18} color="#059669" />
          <span>This worker has been Approved by Assessor</span>
        </div>
      )}

      {/* Header Info Card */}
      <div 
        className="card" 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          margin: 0,
          border: '1.5px solid #CBD5E1',
          boxShadow: '0 4px 12px rgba(0, 45, 98, 0.06)'
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '18px', fontWeight: '800', color: '#002D62' }}>
            {data.worker?.name || 'Worker'}
          </h2>
          <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '0.2rem' }}>
            📞 {data.worker?.phone} | 🌐 {data.worker?.language?.toUpperCase()}
          </div>
          <div style={{ fontSize: '13px', color: '#64748B' }}>
            {data.assessment.trade?.toUpperCase()} • {new Date(data.assessment.startTime).toLocaleDateString()}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#002D62' }}>
            {liveScore}<span style={{ fontSize: '14px', color: '#94A3B8' }}>/100</span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: liveLevel === 'Expert' ? '#16A34A' : (liveLevel === 'Intermediate' ? '#002D62' : '#F59E0B') }}>
            {liveLevel}
          </div>
        </div>
      </div>
      
      {/* Questions list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
        {(data.answers || []).map((ans, idx) => {
          const fa = finalAnswers.find(a => a.id === ans.id);
          const isProof = ans.isProof;

          return (
            <div 
              key={ans.id || idx} 
              className="card" 
              style={{ 
                margin: 0, 
                borderLeft: isProof ? '4px solid #8B5CF6' : ((ans.needs_manual_review) ? '4px solid #F59E0B' : '4px solid #002D62'),
                border: '1.5px solid #E2E8F0',
                borderLeftWidth: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {isProof && <Camera size={16} color="#8B5CF6" />}
                  {ans.questionId || `Question ${idx + 1}`}
                </h4>
                {ans.needs_manual_review && (
                  <span style={{ background: '#FEF3C7', color: '#D97706', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                    ⚠️ Please check
                  </span>
                )}
                {isProof && ans.skipped && (
                  <span style={{ background: '#F1F5F9', color: '#64748B', padding: '0.2rem 0.5rem', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                    Skipped Photo
                  </span>
                )}
              </div>

              {/* Show Proof Image if available */}
              {isProof && ans.imageBase64 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <img 
                    src={ans.imageBase64} 
                    alt="Proof" 
                    style={{ maxWidth: '100%', maxHeight: '220px', borderRadius: '10px', objectFit: 'cover', border: '1.5px solid #CBD5E1' }} 
                  />
                </div>
              )}

              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', fontSize: '14px', fontStyle: 'italic', marginBottom: '0.5rem', borderLeft: '2px solid #CBD5E1', color: '#334155' }}>
                "{ans.text}"
              </div>
              
              {ans.reason && (
                <p style={{ fontSize: '13px', margin: '0 0 0.5rem 0', color: '#475569' }}>
                  <b>AI Reason:</b> {ans.reason}
                </p>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#F1F5F9', padding: '0.5rem 0.75rem', borderRadius: '8px' }}>
                <b style={{ fontSize: '13px', color: '#0F172A' }}>Final Marks (out of 20):</b> 
                <input 
                  type="number" 
                  min="0" 
                  max="20" 
                  value={fa?.marks ?? 0} 
                  onChange={e => handleMarkChange(ans.id, e.target.value)} 
                  style={{ width: '55px', padding: '0.25rem 0.4rem', borderRadius: '6px', border: '1.5px solid #002D62', fontSize: '14px', fontWeight: '700', textAlign: 'center' }} 
                />
                <span style={{ fontSize: '12px', color: '#64748B' }}>(AI: {ans.ai_marks ?? 0})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assessor comment */}
      <div style={{ width: '100%' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#002D62', marginBottom: '0.4rem' }}>
          Assessor Feedback / Comment
        </h4>
        <textarea 
          className="select-box" 
          style={{ width: '100%', minHeight: '80px', fontSize: '14px' }} 
          value={comment} 
          onChange={e => setComment(e.target.value)} 
          placeholder="Enter feedback or advice for worker..." 
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.85rem', width: '100%', marginTop: 'auto' }}>
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={() => router.push('/assessor')}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <button 
          type="button" 
          className="btn-primary" 
          onClick={handleApprove}
          disabled={submitting}
        >
          <CheckCircle size={18} />
          <span>{submitting ? 'Approving...' : (isApproved ? 'Update & Re-Approve' : 'Approve Test')}</span>
        </button>
      </div>
    </div>
  );
}


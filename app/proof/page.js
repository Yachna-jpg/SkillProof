'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, Image as ImageIcon, CheckCircle, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';

function ProofContent() {
  const { t, assessment, setFinalResult } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentIdFromUrl = searchParams.get('assessmentId');
  const activeAssessmentId = assessment?.id || assessmentIdFromUrl;

  const [photoUrl, setPhotoUrl] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(t.proof_error);
      return;
    }
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setErrorMsg(t.proof_error);
      return;
    }
    setErrorMsg('');
    const url = URL.createObjectURL(file);
    setPhotoUrl(url);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const finalize = async (skipped, base64) => {
    if (!activeAssessmentId) {
      router.push('/');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await fetch('/api/score-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: activeAssessmentId,
          imageBase64: base64,
          skipped
        })
      });

      const res = await fetch('/api/finish-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId: activeAssessmentId })
      });

      if (!res.ok) throw new Error('Finish assessment failed');
      const data = await res.json();
      setFinalResult(data);
      router.push(`/result?assessmentId=${activeAssessmentId}`);
    } catch (err) {
      console.error("Proof finalize error:", err);
      setErrorMsg('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="content" style={{ gap: '1.25rem', justifyContent: 'space-between' }}>
      <div style={{ width: '100%', textAlign: 'center' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#002D62', margin: '0 0 0.4rem 0' }}>
          {t.proof_title}
        </h2>
        <p style={{ fontSize: '14px', color: '#666666', margin: 0 }}>
          Upload a clear photo of your work or wiring for assessor review.
        </p>
      </div>
      
      {photoUrl && (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
          <img 
            src={photoUrl} 
            alt="Preview" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '260px', 
              borderRadius: '16px', 
              objectFit: 'cover',
              border: '2px solid #002D62',
              boxShadow: '0 4px 12px rgba(0, 45, 98, 0.12)'
            }} 
          />
        </div>
      )}
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%', justifyContent: 'center' }}>
        <input type="file" accept="image/jpeg, image/png" capture="environment" id="cameraInput" style={{ display: 'none' }} onChange={handleFile} />
        <input type="file" accept="image/jpeg, image/png" id="galleryInput" style={{ display: 'none' }} onChange={handleFile} />
        
        <button 
          type="button" 
          className="btn-secondary" 
          onClick={() => document.getElementById('cameraInput')?.click()}
        >
          <Camera size={20} />
          <span>{t.take_photo}</span>
        </button>

        <button 
          type="button" 
          className="btn-secondary" 
          onClick={() => document.getElementById('galleryInput')?.click()}
        >
          <ImageIcon size={20} />
          <span>{t.choose_gallery}</span>
        </button>

        {errorMsg && (
          <p style={{ color: '#DC2626', textAlign: 'center', fontSize: '13px', fontWeight: '500' }}>
            {errorMsg}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', width: '100%', marginTop: 'auto' }}>
        <button 
          type="button"
          className="btn-secondary" 
          onClick={() => finalize(true, null)} 
          disabled={isSubmitting}
        >
          {t.skip}
        </button>

        <button 
          type="button"
          className="btn-primary" 
          onClick={() => finalize(false, photoBase64)} 
          disabled={!photoBase64 || isSubmitting}
        >
          <span>{isSubmitting ? t.submitting : t.submit_photo}</span>
          <CheckCircle size={18} />
        </button>
      </div>
    </div>
  );
}

export default function ProofPage() {
  return (
    <Suspense fallback={<div className="content"><p>Loading...</p></div>}>
      <ProofContent />
    </Suspense>
  );
}

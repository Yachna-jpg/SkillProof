'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, ArrowRight, RotateCcw, Volume2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';

function TestContent() {
  const { lang, t, assessment, fetchAssessmentById } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentIdFromUrl = searchParams.get('assessmentId');
  const activeAssessmentId = assessment?.id || assessmentIdFromUrl;

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechError, setSpeechError] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recognitionObj, setRecognitionObj] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [questionsError, setQuestionsError] = useState(false);
  const [loadRetry, setLoadRetry] = useState(0);

  useEffect(() => {
    if (!activeAssessmentId) {
      alert(lang === 'hi' ? 'कृपया अपना टेस्ट फिर से शुरू करें' : 'Please start your test again');
      router.push('/');
      return;
    }

    if (!assessment && assessmentIdFromUrl) {
      fetchAssessmentById(assessmentIdFromUrl);
    }

    setQuestionsError(false);
    fetch('/api/questions')
      .then(res => {
        if (!res.ok) throw new Error("Questions fetch failed");
        return res.json();
      })
      .then(data => setQuestions(data.questions || []))
      .catch(err => {
        console.error("Fetch Error:", err);
        setQuestionsError(true);
      });
  }, [loadRetry, activeAssessmentId, assessment, assessmentIdFromUrl, fetchAssessmentById, router, lang]);

  const currentQuestion = questions[currentIndex];
  const questionText = currentQuestion ? (lang === 'hi' ? currentQuestion.question_hi : currentQuestion.question_en) : '';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition && !recognitionObj) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.onresult = (event) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
            setAnswerText(prev => prev + (prev ? ' ' : '') + finalTranscript);
          }
        };
        rec.onerror = (event) => {
          if (event.error === 'not-allowed') {
            setSpeechError(t.mic_blocked);
          } else {
            setSpeechError('Microphone error: ' + event.error);
          }
          setIsRecording(false);
        };
        rec.onend = () => {
          setIsRecording(false);
        };
        setRecognitionObj(rec);
      }
    }
  }, [t.mic_blocked, recognitionObj]);

  useEffect(() => {
    if (questionText) {
      handleListen();
    }
    // eslint-disable-next-line
  }, [questionText, lang]);

  const handleListen = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && questionText) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(questionText);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (!recognitionObj) {
      setSpeechError(t.mic_blocked);
      return;
    }

    if (isRecording) {
      recognitionObj.stop();
      setIsRecording(false);
    } else {
      recognitionObj.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      try {
        recognitionObj.start();
        setIsRecording(true);
        setSpeechError('');
        setErrorMsg('');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleNext = async () => {
    if (!answerText.trim()) {
      setErrorMsg(t.please_answer);
      return;
    }
    setErrorMsg('');
    if (isRecording && recognitionObj) {
      recognitionObj.stop();
      setIsRecording(false);
    }

    setIsChecking(true);
    const payload = {
      assessmentId: activeAssessmentId,
      questionId: currentQuestion.id,
      text: answerText,
      language: lang
    };

    try {
      const res = await fetch('/api/score-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Server error " + res.status);
    } catch (err) {
      console.error("Submit Error:", err);
    } finally {
      setIsChecking(false);
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setAnswerText('');
    } else {
      router.push(`/proof?assessmentId=${activeAssessmentId}`);
    }
  };

  if (questionsError) {
    return (
      <div className="content">
        <p style={{ color: '#DC2626', fontWeight: 'bold', textAlign: 'center', margin: '2rem 0 1rem' }}>
          {lang === 'hi' ? 'सर्वर से कनेक्ट नहीं हो सका' : 'Could not connect to server'}
        </p>
        <button className="btn-primary" onClick={() => setLoadRetry(r => r + 1)} style={{ marginBottom: '0.85rem' }}>
          Try again
        </button>
        <button className="btn-secondary" onClick={() => router.push('/home')}>
          Go to Home
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="content" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '350px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #E2E8F0', borderTopColor: '#002D62', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '1rem', fontWeight: '600', color: '#002D62' }}>Loading question...</p>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="content" style={{ gap: '1.25rem' }}>
      {/* Top Question Count & Progress Bar */}
      <div style={{ width: '100%' }}>
        <p style={{ fontWeight: '700', fontSize: '14px', color: '#002D62', margin: '0 0 0.5rem 0' }}>
          Question {currentIndex + 1} of {questions.length}
        </p>
        <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
          <div 
            style={{ 
              width: `${progressPercent}%`, 
              height: '100%', 
              background: '#002D62', 
              borderRadius: '999px',
              transition: 'width 0.3s ease'
            }} 
          />
        </div>
      </div>
      
      {/* Question Card */}
      <div 
        className="card" 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1rem',
          margin: 0,
          border: '1.5px solid #CBD5E1',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)'
        }}
      >
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0F172A', lineHeight: 1.4 }}>
          {questionText}
        </h3>

        <button 
          type="button"
          onClick={handleListen}
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.9rem',
            borderRadius: '20px',
            background: '#FFFFFF',
            color: '#002D62',
            border: '1.5px solid #002D62',
            fontSize: '13px',
            fontWeight: '600',
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
        >
          <Volume2 size={15} color="#002D62" />
          <span>{t.listen}</span>
        </button>
      </div>

      {/* Voice Recording / Input Section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0.5rem 0' }}>
        {speechError && (
          <p style={{ color: '#DC2626', textAlign: 'center', fontSize: '13px', marginBottom: '0.75rem', fontWeight: '500' }}>
            {speechError}
          </p>
        )}
        
        {/* Modern Mic Button */}
        <button 
          onClick={toggleRecording}
          type="button"
          aria-label={isRecording ? "Stop recording" : "Start recording"}
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '50%',
            border: 'none',
            background: isRecording ? '#DC2626' : '#002D62',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: isRecording ? '0 0 0 10px rgba(220, 38, 38, 0.25)' : '0 8px 20px rgba(0, 45, 98, 0.25)',
            animation: isRecording ? 'pulse 1.5s infinite' : 'none',
            marginBottom: '1.25rem',
            transition: 'all 0.25s ease'
          }}
        >
          <Mic size={40} />
        </button>
        
        {/* Modern Textarea */}
        <div style={{ width: '100%' }}>
          <textarea 
            className="select-box"
            style={{ 
              width: '100%', 
              minHeight: '120px', 
              fontSize: '15px',
              border: '1.5px solid #CBD5E1',
              borderRadius: '14px',
              padding: '0.9rem 1rem',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)'
            }}
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder={lang === 'hi' ? "आपका उत्तर यहाँ दिखाई देगा..." : "Your answer will appear here..."}
          />
          {errorMsg && (
            <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '0.4rem', fontWeight: '500', textAlign: 'center' }}>
              {errorMsg}
            </p>
          )}
        </div>
      </div>
      
      {/* Action Buttons: Try Again & Next */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', width: '100%', marginTop: 'auto' }}>
        <button 
          type="button"
          className="btn-secondary" 
          onClick={() => setAnswerText('')} 
          disabled={isChecking}
        >
          <RotateCcw size={16} />
          <span>{t.try_again}</span>
        </button>

        <button 
          type="button"
          className="btn-primary" 
          onClick={handleNext} 
          disabled={isChecking}
        >
          <span>{isChecking ? 'Saving...' : t.next}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense fallback={<div className="content"><p>Loading question...</p></div>}>
      <TestContent />
    </Suspense>
  );
}

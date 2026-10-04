'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/lib/translations';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [lang, setLang] = useState('en');
  const [worker, setWorker] = useState(null);
  const [assessment, setAssessment] = useState(null);
  const [finalResult, setFinalResult] = useState(null);
  const [assessorToken, setAssessorToken] = useState(null);

  const t = translations[lang] || translations.en;

  // Helper to restore worker from DB if reloaded with ?workerId=...
  const fetchWorkerById = async (workerId) => {
    if (!workerId) return null;
    try {
      const res = await fetch(`/api/workers?id=${workerId}&t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setWorker(data.worker);
        return data.worker;
      }
    } catch (err) {
      console.error("Failed to fetch worker by id:", err);
    }
    return null;
  };

  // Helper to restore assessment from DB if reloaded with ?assessmentId=...
  const fetchAssessmentById = async (assessmentId) => {
    if (!assessmentId) return null;
    try {
      const res = await fetch(`/api/assessments/${assessmentId}?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setAssessment(data.assessment);
        if (data.worker) {
          setWorker(data.worker);
        }
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch assessment by id:", err);
    }
    return null;
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        worker,
        setWorker,
        assessment,
        setAssessment,
        finalResult,
        setFinalResult,
        assessorToken,
        setAssessorToken,
        fetchWorkerById,
        fetchAssessmentById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

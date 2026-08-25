import { useState, useEffect } from 'react';

const TRIAL_KEY = 'voley_club_visitor_trial_start';
const TRIAL_DURATION_DAYS = 7;

export function useVisitorTrial() {
  const [trialStart, setTrialStart] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(TRIAL_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed)) {
        setTrialStart(parsed);
      }
    }
    setIsLoaded(true);
  }, []);

  const startTrial = () => {
    const now = Date.now();
    localStorage.setItem(TRIAL_KEY, now.toString());
    setTrialStart(now);
  };

  const resetTrial = () => {
    localStorage.removeItem(TRIAL_KEY);
    setTrialStart(null);
  };

  let isTrialActive = false;
  let daysElapsed = 0;
  let daysRemaining = 0;
  let currentDay = 1;

  if (trialStart) {
    const now = Date.now();
    const diffMs = now - trialStart;
    daysElapsed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    currentDay = Math.min(7, daysElapsed + 1);
    daysRemaining = Math.max(0, TRIAL_DURATION_DAYS - daysElapsed);
    isTrialActive = daysRemaining > 0;
  }

  return {
    isTrialStarted: trialStart !== null,
    isTrialActive,
    daysRemaining,
    currentDay,
    startTrial,
    resetTrial,
    isLoaded
  };
}

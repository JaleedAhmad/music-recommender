import { useState, useEffect } from 'react';

export function useMoodHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('aurabeat_history');
    if (stored) {
      try {
        setHistory(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse mood history from localStorage", e);
      }
    }
  }, []);

  const addHistory = (entry) => {
    setHistory(prev => {
      const newHistory = [entry, ...prev].slice(0, 5);
      localStorage.setItem('aurabeat_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  return { history, addHistory };
}

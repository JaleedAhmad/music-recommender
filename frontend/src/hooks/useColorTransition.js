import { useEffect } from 'react';

export function useColorTransition(colors) {
  useEffect(() => {
    if (!colors || colors.length < 3) return;
    
    // CSS transitions are defined in index.css using CSS variables and @property
    // So we just update the variables, and the browser handles the smooth 800ms interpolation.
    const root = document.documentElement;
    root.style.setProperty('--color-primary', colors[0]);
    root.style.setProperty('--color-secondary', colors[1]);
    root.style.setProperty('--color-accent', colors[2]);
    
    if (colors[3]) {
        root.style.setProperty('--color-text', colors[3]);
    }
  }, [colors]);
}

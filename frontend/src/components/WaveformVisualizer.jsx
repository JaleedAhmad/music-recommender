import React from 'react';
import { motion } from 'framer-motion';

export default function WaveformVisualizer({ bpm, energy, active }) {
  const bars = Array.from({ length: 32 });
  
  // Base properties
  let baseDuration = 1;
  let amplitude = 1;
  
  if (active) {
    baseDuration = bpm ? 60 / bpm : 0.5; // seconds per beat
    
    switch (energy?.toLowerCase()) {
      case 'high': amplitude = 1.5; break;
      case 'low': amplitude = 0.5; break;
      case 'medium':
      default: amplitude = 1; break;
    }
  } else {
    // Idle state: slow breathing
    baseDuration = 2;
    amplitude = 0.3;
  }

  return (
    <div className="flex items-end justify-center gap-1 h-16 w-full overflow-hidden">
      {bars.map((_, i) => {
        // Create a slight wave effect by varying the base height and delay
        const heightPercent = 20 + Math.random() * 80 * amplitude;
        
        return (
          <motion.div
            key={i}
            className="w-1.5 rounded-t-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]"
            initial={{ height: "10%" }}
            animate={{ height: `${heightPercent}%` }}
            transition={{
              repeat: Infinity,
              repeatType: "reverse",
              duration: baseDuration + (Math.random() * 0.2), // slight organic variation
              delay: i * 0.05, // offset each bar
              ease: "easeInOut"
            }}
          />
        );
      })}
    </div>
  );
}

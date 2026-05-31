import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOADING_TEXTS = [
  "Reading your vibe...",
  "Checking the weather...",
  "Curating your sound..."
];

export default function LoadingState() {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex(prev => (prev + 1) % LOADING_TEXTS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex justify-start items-center gap-4 py-2"
    >
      <div className="bg-white/5 p-5 rounded-2xl rounded-tl-none border border-white/5 flex flex-col gap-4 shadow-lg min-w-[200px]">
        {/* Scanning Wave */}
        <div className="flex items-end gap-1 h-8 overflow-hidden relative w-full">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-indigo-400 rounded-full"
              initial={{ height: "20%", opacity: 0.3 }}
              animate={{ height: ["20%", "100%", "20%"], opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Cycling Text */}
        <div className="h-4 relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={textIndex}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute text-xs text-slate-300 font-bold tracking-widest uppercase w-full"
            >
              {LOADING_TEXTS[textIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

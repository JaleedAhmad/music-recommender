import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, SlidersHorizontal } from 'lucide-react';

export default function MoodInput({ onSubmit, isLoading }) {
  const [mood, setMood] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [energy, setEnergy] = useState('');
  const [bpm, setBpm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!mood.trim() || isLoading) return;
    onSubmit({
      mood: mood.trim(),
      energyPreference: energy || undefined,
      bpmPreference: bpm ? parseInt(bpm, 10) : undefined
    });
    setMood('');
  };

  return (
    <div className="bg-black/20 border-t border-[rgba(255,255,255,0.08)] p-6 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex gap-3 relative">
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="Describe your current mood..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all placeholder:text-slate-500 text-slate-200 shadow-inner"
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-4 rounded-2xl border transition-all flex items-center justify-center ${showAdvanced ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
            title="Advanced Settings"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isLoading || !mood.trim()}
            className="bg-[var(--color-accent)] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-2xl transition-all shadow-[0_0_15px_var(--color-accent)] opacity-90 flex items-center justify-center gap-2"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/5 mt-2">
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Energy</label>
                  <div className="flex bg-black/40 rounded-lg p-1">
                    {['low', 'medium', 'high'].map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setEnergy(energy === level ? '' : level)}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${energy === level ? 'bg-white/20 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">BPM (60-180)</label>
                  <input
                    type="number"
                    min="60"
                    max="180"
                    value={bpm}
                    onChange={(e) => setBpm(e.target.value)}
                    placeholder="Any BPM"
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-indigo-500/50 text-white placeholder:text-slate-600"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

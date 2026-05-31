import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, X, Music } from 'lucide-react';

export default function MoodHistorySidebar({ isOpen, onClose, history }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-80 bg-[#080808]/95 backdrop-blur-2xl border-l border-white/10 p-6 z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-slate-400" /> Vibe History
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 chat-scroll">
              {history.length === 0 ? (
                <div className="text-center text-slate-500 mt-10 space-y-3">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <History className="w-6 h-6 opacity-50" />
                  </div>
                  <p className="text-sm">No history yet.<br/>Start discovering music!</p>
                </div>
              ) : (
                history.map((item, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={idx} 
                    className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3 hover:bg-white/10 transition-colors"
                  >
                    <div 
                      className="w-1.5 rounded-full shrink-0 shadow-lg"
                      style={{ backgroundColor: item.colors?.[0] || '#4f46e5' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-400 truncate mb-1">"{item.mood.substring(0, 40)}{item.mood.length > 40 ? '...' : ''}"</p>
                      <h4 className="text-sm font-bold text-white truncate">{item.song}</h4>
                      <p className="text-xs text-slate-300 truncate">by {item.artist}</p>
                      
                      {item.mood_tag && (
                        <div className="mt-2 inline-block px-2 py-0.5 rounded border border-white/10 bg-black/40 text-[10px] text-slate-300 uppercase tracking-wider font-bold">
                          {item.mood_tag}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

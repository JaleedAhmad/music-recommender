import React from 'react';
import { WifiOff, RefreshCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ErrorCard({ onRetry }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start items-center"
    >
      <div className="bg-red-500/10 border border-red-500/20 p-5 rounded-2xl rounded-tl-none shadow-lg max-w-[85%] flex items-start gap-4 backdrop-blur-md">
        <div className="p-2 bg-red-500/20 rounded-full shrink-0">
          <WifiOff className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-slate-200 text-sm font-medium">
            Our music brain is taking a break. Try again in a moment.
          </p>
          {onRetry && (
            <button 
              onClick={onRetry}
              className="self-start flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors border border-white/5"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, CheckCircle, Loader2 } from 'lucide-react';
import API_BASE_URL from '../config';

export default function SettingsPanel({ isOpen, onClose }) {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('aurabeat_lastfm');
    if (saved) {
      setUsername(saved);
      setStatus('success');
    }
  }, []);

  const handleConnect = async () => {
    if (!username.trim()) {
      localStorage.removeItem('aurabeat_lastfm');
      setStatus('idle');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/lastfm/${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error('Failed to connect');
      
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error('Invalid response');
      
      localStorage.setItem('aurabeat_lastfm', username);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg('Could not fetch user. Check username.');
      localStorage.removeItem('aurabeat_lastfm');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-80 bg-[#080808]/90 backdrop-blur-xl border-l border-white/10 p-6 z-50 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" /> Settings
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-300 block">Last.fm Connection</label>
                <p className="text-xs text-slate-500">Connect Last.fm to personalize recommendations with your top artists.</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (status === 'success') setStatus('idle');
                    }}
                    placeholder="Username"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleConnect}
                    disabled={status === 'loading'}
                    className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect'}
                  </button>
                </div>
                {status === 'success' && (
                  <div className="flex items-center gap-2 text-green-400 text-xs mt-2">
                    <CheckCircle className="w-3.5 h-3.5" /> Connected as {username}
                  </div>
                )}
                {status === 'error' && (
                  <div className="text-red-400 text-xs mt-2">{errorMsg}</div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

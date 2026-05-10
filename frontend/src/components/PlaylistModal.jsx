import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Video, Send, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_BASE_URL from '../config';

export default function PlaylistModal({ isOpen, onClose, onRecommendation }) {
    const [playlistUrl, setPlaylistUrl] = useState('');
    const [mood, setMood] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    const handleVibe = async (e) => {
        e.preventDefault();
        setLoading(true);

        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const response = await fetch(`${API_BASE_URL}/api/playlist/vibe`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ playlistUrl, mood, lat: latitude, lon: longitude })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message);

                onRecommendation(data);
                onClose();
            } catch (err) {
                alert(err.message);
            } finally {
                setLoading(false);
            }
        }, () => {
            alert("Location is required for the best vibe.");
            setLoading(false);
        });
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-3xl p-10 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
                    
                    <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-red-500/20 rounded-2xl">
                            <Video className="w-8 h-8 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Vibe My Playlist</h2>
                            <p className="text-slate-400 text-sm">Pick the perfect song from your own curation.</p>
                        </div>
                    </div>

                    <form onSubmit={handleVibe} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">YouTube Playlist URL</label>
                            <input 
                                type="text" 
                                placeholder="https://youtube.com/playlist?list=..." 
                                value={playlistUrl}
                                onChange={(e) => setPlaylistUrl(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-slate-500 ml-1">Your Current Mood</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Feeling like a rainy late night drive..." 
                                value={mood}
                                onChange={(e) => setMood(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
                                required
                            />
                        </div>

                        <button 
                            disabled={loading}
                            type="submit"
                            className="w-full bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white font-bold py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 group"
                        >
                            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                                    <span>Find the Vibe</span>
                                </>
                            )}
                        </button>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

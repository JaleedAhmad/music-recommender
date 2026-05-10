import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Music, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_BASE_URL from '../config';

export default function HistorySidebar({ isOpen, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        if (isOpen && token) {
            fetchHistory();
        }
    }, [isOpen, token]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setHistory(data);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        } finally {
            setLoading(false);
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
                        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-slate-900 border-l border-white/10 shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-indigo-400" />
                                <h2 className="text-lg font-bold text-white">Your Vibe History</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {loading ? (
                                <div className="flex justify-center py-20">
                                    <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                </div>
                            ) : history.length > 0 ? (
                                history.map((item) => (
                                    <div key={item._id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 hover:bg-white/10 transition-all group">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-indigo-400">"{item.song}"</h3>
                                                <p className="text-sm text-slate-300">by {item.artist}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg text-[10px] text-slate-500 font-bold uppercase">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        
                                        <p className="text-xs text-slate-400 italic line-clamp-2 leading-relaxed">
                                            "{item.reason}"
                                        </p>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                                <MapPin className="w-3 h-3" />
                                                {item.location}
                                            </div>
                                            <a 
                                                href={`https://www.youtube.com/watch?v=${item.youtubeVideoId}`} 
                                                target="_blank" 
                                                rel="noreferrer"
                                                className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-indigo-500 hover:text-white"
                                            >
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 opacity-40">
                                    <Music className="w-12 h-12 mx-auto mb-4" />
                                    <p className="text-sm">No vibes recorded yet.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

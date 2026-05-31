import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../AuthContext';
import API_BASE_URL from '../config';

export default function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [touched, setTouched] = useState({ username: false, password: false, confirmPassword: false });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();

    // Reset state when switching modes
    useEffect(() => {
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setTouched({ username: false, password: false, confirmPassword: false });
        setError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    }, [isLogin]);

    const getUsernameError = () => {
        if (!touched.username) return '';
        if (!username) return "This field is required";
        if (username.length < 3) return "Username must be at least 3 characters";
        if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Only letters, numbers and underscores allowed";
        return '';
    };

    const getPasswordError = () => {
        if (!touched.password) return '';
        if (!password) return "This field is required";
        if (password.length < 8) return "Password must be at least 8 characters";
        return '';
    };

    const getConfirmPasswordError = () => {
        if (!touched.confirmPassword || isLogin) return '';
        if (!confirmPassword) return "This field is required";
        if (password !== confirmPassword) return "Passwords do not match";
        return '';
    };

    const getPasswordStrength = () => {
        if (!password) return { level: 0, text: '', color: 'bg-transparent' };
        if (password.length < 8) return { level: 1, text: 'Weak', color: 'bg-red-500' };
        
        let types = 0;
        if (/[a-zA-Z]/.test(password)) types++;
        if (/[0-9]/.test(password)) types++;
        if (/[^a-zA-Z0-9]/.test(password)) types++;
        
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNum = /[0-9]/.test(password);
        const hasSym = /[^a-zA-Z0-9]/.test(password);

        if (hasUpper && hasLower && hasNum && hasSym) {
            return { level: 4, text: 'Very Strong', color: 'bg-green-500' };
        }
        if (types >= 2) return { level: 3, text: 'Strong', color: 'bg-yellow-500' };
        return { level: 2, text: 'Fair', color: 'bg-orange-500' };
    };

    const strength = getPasswordStrength();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Force touch all fields to show errors
        setTouched({ username: true, password: true, confirmPassword: true });
        
        if (getUsernameError() || getPasswordError() || (!isLogin && getConfirmPasswordError())) {
            return;
        }

        setLoading(true);
        setError('');

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Auth failed');

            login(data.user, data.token);
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-md bg-slate-900/80 border border-white/10 rounded-3xl p-8 shadow-2xl relative"
                >
                    <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>

                    <h2 className="text-2xl font-bold text-white mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                    <p className="text-slate-400 text-sm mb-8">{isLogin ? 'Your musical journey continues here.' : 'Start your personalized AI sound experience.'}</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Username" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, username: true }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                            {getUsernameError() && <p className="text-red-400 text-xs mt-1.5 ml-2 font-medium">{getUsernameError()}</p>}
                        </div>

                        <div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="Password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {getPasswordError() && <p className="text-red-400 text-xs mt-1.5 ml-2 font-medium">{getPasswordError()}</p>}
                            
                            {!isLogin && password.length > 0 && (
                                <div className="mt-3 ml-1 mr-1">
                                    <div className="flex h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(strength.level / 4) * 100}%` }}
                                            transition={{ duration: 0.3 }}
                                            className={`h-full ${strength.color}`}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5 ml-1 font-medium">{strength.text}</p>
                                </div>
                            )}
                        </div>

                        {!isLogin && (
                            <div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                    <input 
                                        type={showConfirmPassword ? "text" : "password"} 
                                        placeholder="Confirm Password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {getConfirmPasswordError() && <p className="text-red-400 text-xs mt-1.5 ml-2 font-medium">{getConfirmPasswordError()}</p>}
                            </div>
                        )}

                        {error && <p className="text-red-400 text-sm font-medium bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center">{error}</p>}

                        <button 
                            disabled={loading}
                            type="submit"
                            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                                    >
                                        <Loader2 className="w-5 h-5" />
                                    </motion.div>
                                    <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                                </>
                            ) : (
                                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-400 text-sm mt-8">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-indigo-400 font-bold hover:underline transition-colors"
                        >
                            {isLogin ? 'Sign Up' : 'Sign In'}
                        </button>
                    </p>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

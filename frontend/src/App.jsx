import React, { useState, useEffect, useRef } from 'react';
import { Music, Cloud, Sun, Thermometer, History, Sparkles, LogOut, Video, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import AuthModal from './components/AuthModal';
import PlaylistModal from './components/PlaylistModal';
import MoodInput from './components/MoodInput';
import WaveformVisualizer from './components/WaveformVisualizer';
import MoodHistorySidebar from './components/MoodHistorySidebar';
import SettingsPanel from './components/SettingsPanel';
import LoadingState from './components/LoadingState';
import ErrorCard from './components/ErrorCard';
import { useMoodHistory } from './hooks/useMoodHistory';
import { useColorTransition } from './hooks/useColorTransition';
import API_BASE_URL from './config';
import './App.css';

const MOOD_CHIPS = ['Chill ☕', 'Productive 💻', 'Energetic ⚡', 'Relaxed 🌊', 'Sad 🌧️', 'Happy ☀️'];

function WelcomeScreen({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="max-w-4xl w-full text-center z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.3)] text-3xl">
            🎵
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>AuraBeat</h1>
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Your Mood, <span className="text-indigo-400">Curated by AI</span>.
        </h2>
        
        <p className="text-slate-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          AuraBeat translates your emotions and local weather into the perfect soundscape. 
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-indigo-600 rounded-full font-bold text-lg shadow-lg hover:bg-indigo-500 transition-all"
          >
            Get Started ✨
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! How are you feeling right now? I'll find the perfect song for you." }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastSubmission, setLastSubmission] = useState(null);
  
  const [colors, setColors] = useState(['#0f2027', '#203a43', '#2c5364']);
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  const [activeBpm, setActiveBpm] = useState(null);
  const [activeEnergy, setActiveEnergy] = useState(null);
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  
  const { user, token, logout } = useAuth();
  const { history, addHistory } = useMoodHistory();
  useColorTransition(colors);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, hasError]);

  const handleRetry = () => {
    if (lastSubmission) {
      setHasError(false);
      setMessages(prev => prev.slice(0, -1)); // Remove the last user message
      handleSendMessage(lastSubmission);
    } else {
      setHasError(false);
    }
  };

  const handleSendMessage = async ({ mood, energyPreference, bpmPreference }) => {
    setMessages(prev => [...prev, { role: 'user', text: mood }]);
    setIsLoading(true);
    setHasError(false);
    setLastSubmission({ mood, energyPreference, bpmPreference });
    
    setActiveBpm(null);
    setActiveEnergy(null);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const lastfmUsername = localStorage.getItem('aurabeat_lastfm');
        let lastfmArtists = [];
        if (lastfmUsername) {
            const res = await fetch(`${API_BASE_URL}/api/lastfm/${encodeURIComponent(lastfmUsername)}`);
            if (res.ok) {
                lastfmArtists = await res.json();
            }
        }
        
        const response = await fetch(`${API_BASE_URL}/api/recommend`, {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
              mood,
              lat: latitude,
              lon: longitude,
              moodHistory: history,
              lastfmArtists,
              bpmPreference,
              energyPreference
          })
        });
        
        if (!response.ok) {
          throw new Error('Server error');
        }

        const data = await response.json();
        
        setWeatherData(data.weather);
        setLocation(data.location);

        if (data.aiColors && data.aiColors.primary) {
          setColors([data.aiColors.primary, data.aiColors.secondary, data.aiColors.accent, data.aiColors.text]);
        } else if (data.colors && data.colors.length >= 3) {
          setColors(data.colors);
        }

        const botResponse = (
          <div className="space-y-3">
            <p className="text-sm opacity-80">Based on your mood and the vibe in <strong>{data.location}</strong>:</p>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="ui-panel p-4 rounded-xl shadow-lg relative overflow-hidden"
              style={{ boxShadow: `0 8px 32px 0 rgba(0,0,0,0.3), inset 0 0 20px var(--color-accent)22` }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)] opacity-20 blur-3xl rounded-full"></div>
              
              <div className="relative z-10">
                  <p className="font-bold text-lg" style={{ color: 'var(--color-accent)' }}>"{data.recommendation.song}"</p>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-sm text-slate-200 font-medium">by {data.recommendation.artist}</p>
                    <Music className="w-4 h-4 opacity-80" style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <p className="text-xs italic text-slate-300 border-t border-[rgba(255,255,255,0.1)] mt-3 pt-3 flex items-start gap-2 leading-relaxed">
                    <Sparkles className="w-3.5 h-3.5 mt-0.5 text-yellow-400 shrink-0" />
                    <span>{data.recommendation.reason}</span>
                  </p>
                  
                  {data.recommendation.spotifyUrl && (
                    <a 
                      href={data.recommendation.spotifyUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-[#1DB954]/10 hover:bg-[#1DB954]/20 text-[#1DB954] rounded-lg text-xs font-bold transition-all border border-[#1DB954]/20"
                    >
                      <Music className="w-3.5 h-3.5" />
                      Listen on Spotify
                    </a>
                  )}
              </div>
            </motion.div>
          </div>
        );

        setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
        
        if (data.youtubeVideoId) {
          setYoutubeVideoId(data.youtubeVideoId);
        }
        
        setActiveBpm(data.bpm);
        setActiveEnergy(data.energy);

        addHistory({
            mood,
            song: data.recommendation.song,
            artist: data.recommendation.artist,
            colors: data.colors || [data.aiColors?.primary],
            mood_tag: data.mood_tag
        });

      } catch (error) {
        console.error("API Error details:", error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Geolocation Error:", error);
      setMessages(prev => [...prev, { role: 'bot', text: "I couldn't access your location. Please enable location services." }]);
      setIsLoading(false);
    });
  };

  if (!user) {
    return (
      <>
        <WelcomeScreen onGetStarted={() => setIsAuthModalOpen(true)} />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  const radialBackgroundStyle = {
    background: `radial-gradient(circle at top right, var(--color-primary) 0%, transparent 50%), radial-gradient(circle at bottom left, var(--color-secondary) 0%, transparent 50%), #080808`
  };

  return (
    <div 
      className="min-h-screen p-4 md:p-8 lg:p-12 flex items-center justify-center transition-all duration-[800ms] ease-in-out"
      style={radialBackgroundStyle}
    >
      <div className="w-full max-w-7xl h-[85vh] flex flex-col lg:flex-row gap-6 relative">
        
        {/* Weather Insight (Floating Widget) */}
        {weatherData && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute -top-12 left-4 px-4 py-2 bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-full flex items-center gap-4 shadow-2xl z-20"
          >
            <div className="flex items-center gap-2 border-r border-white/10 pr-4">
               <Thermometer className="w-4 h-4 text-orange-400" />
               <span className="text-sm font-bold">{weatherData.temperature}°C</span>
            </div>
            <div className="flex items-center gap-2">
               {weatherData.description.toLowerCase().includes('clear') ? <Sun className="w-4 h-4 text-yellow-400" /> : <Cloud className="w-4 h-4 text-slate-400" />}
               <span className="text-sm font-medium">{weatherData.description}</span>
            </div>
            <div className="text-xs opacity-50 px-2">in {location}</div>
          </motion.div>
        )}

        {/* Chat Section */}
        <motion.div 
          layout
          className="flex-1 flex flex-col ui-panel rounded-3xl overflow-hidden relative z-10"
        >
          {/* Header */}
          <div className="p-5 ui-header flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center shadow-inner transition-colors duration-700">
                <Music className="text-white w-6 h-6 opacity-90" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight leading-none text-white drop-shadow-sm" style={{ fontFamily: 'var(--font-display)' }}>AuraBeat</h1>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black mt-1.5">AI Sound Curator</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-white/10 mx-1" />

              <div className="flex items-center gap-2">
                  <button 
                  onClick={() => setIsHistoryOpen(true)}
                  className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white"
                  title="History"
                >
                  <History className="w-5 h-5" />
                </button>
                <button 
                  onClick={logout}
                  className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-red-400 hover:bg-red-500/10"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-lg transition-colors duration-700">
                  {user.username[0]}
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 chat-scroll space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-xl ${
                    msg.role === 'user' 
                      ? 'text-white rounded-tr-none' 
                      : 'bg-[rgba(255,255,255,0.03)] text-slate-100 rounded-tl-none border border-white/5'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: 'var(--color-accent)' } : {}}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && <LoadingState />}
            
            {hasError && (
              <ErrorCard onRetry={handleRetry} />
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Waveform Visualizer */}
          <div className="px-6 pb-2">
             <WaveformVisualizer active={!!youtubeVideoId && !isLoading} bpm={activeBpm} energy={activeEnergy} />
          </div>

          {/* Quick Mood Chips */}
          <div className="px-6 py-3 border-t border-[rgba(255,255,255,0.05)] flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
            {MOOD_CHIPS.map((chip) => (
              <motion.button
                key={chip}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage({ mood: chip })}
                className="mood-chip"
              >
                {chip}
              </motion.button>
            ))}
          </div>

          {/* Input Area */}
          <MoodInput onSubmit={handleSendMessage} isLoading={isLoading} />
        </motion.div>

        {/* Player Section */}
        <motion.div 
          layout
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`lg:w-96 flex flex-col ui-panel rounded-3xl overflow-hidden ${youtubeVideoId ? 'flex' : 'hidden lg:flex'}`}
        >
          <div className="p-5 ui-header flex items-center justify-between">
            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-400">Visual Experience</h2>
            {youtubeVideoId && <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse shadow-[0_0_8px_var(--color-accent)] transition-colors duration-700"></div>}
          </div>
          <div className="flex-1 p-8 flex flex-col items-center justify-center">
            {youtubeVideoId ? (
              <motion.div 
                initial={{ scale: 0.9, rotateY: 20 }}
                animate={{ scale: 1, rotateY: 0 }}
                className="w-full relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-[rgba(255,255,255,0.2)]">
                  <iframe 
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`} 
                    title="YouTube video player" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              </motion.div>
            ) : (
              <div className="text-center space-y-4 opacity-40">
                <div className="w-20 h-20 mx-auto rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                   <Music className="w-10 h-10 text-slate-500" />
                </div>
                <p className="text-sm font-medium tracking-wide">Tell me your mood to start the visualizer</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <MoodHistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} history={history} />
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { Send, Music, Zap, ZapOff, FastForward, Loader2, Thermometer, Cloud, Sun, History, Sparkles, User, LogOut, Video, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import AuthModal from './components/AuthModal';
import HistorySidebar from './components/HistorySidebar';
import PlaylistModal from './components/PlaylistModal';
// Removed external WelcomeScreen to fix build tracing issues
import API_BASE_URL from './config';
import './App.css';

const ANIMATION_SPEEDS = [40, 20, 8]; // Slow, Medium, Fast
const MOOD_CHIPS = ['Chill ☕', 'Productive 💻', 'Energetic ⚡', 'Relaxed 🌊', 'Sad 🌧️', 'Happy ☀️'];

function WelcomeScreen({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="max-w-4xl w-full text-center z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 flex items-center justify-center text-3xl">
            🎵
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">AuraBeat</h1>
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
          Your Mood, <span className="text-indigo-500">Curated by AI</span>.
        </h2>
        
        <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
          AuraBeat translates your emotions and local weather into the perfect soundscape. 
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-16">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 bg-indigo-600 rounded-full font-bold text-lg shadow-lg shadow-indigo-500/25 flex items-center gap-2 hover:bg-indigo-500 transition-all"
          >
            Get Started ✨
          </button>
          
          <a 
            href="https://github.com/JaleedAhmad/music-recommender" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            GitHub
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-all">
            <div className="text-2xl mb-4">⚡</div>
            <h3 className="text-white font-bold mb-2">AI Recommendations</h3>
            <p className="text-gray-500 text-sm">Powered by Gemini.</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-all">
            <div className="text-2xl mb-4">🌈</div>
            <h3 className="text-white font-bold mb-2">Dynamic Visuals</h3>
            <p className="text-gray-500 text-sm">Adaptive UI colors.</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-all">
            <div className="text-2xl mb-4">📜</div>
            <h3 className="text-white font-bold mb-2">Vibe History</h3>
            <p className="text-gray-500 text-sm">Save your moments.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SoundWave() {
  return (
    <div className="flex items-end gap-0.5 h-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className="sound-bar" 
          style={{ animationDelay: `${i * 0.15}s` }} 
        />
      ))}
    </div>
  );
}

function App() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! How are you feeling right now? I'll find the perfect song for you." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [colors, setColors] = useState(['#0f172a', '#1e293b', '#334155']); // Default slate colors
  const [isAnimationActive, setIsAnimationActive] = useState(true);
  const [speedIndex, setSpeedIndex] = useState(1); // Default medium
  const [youtubeVideoId, setYoutubeVideoId] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [location, setLocation] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const { user, token, logout } = useAuth();
  const chatEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update background style
  const backgroundStyle = {
    background: `linear-gradient(-45deg, ${colors[0]}, ${colors[1]}, ${colors[2]})`,
    backgroundSize: '400% 400%',
    animationDuration: `${ANIMATION_SPEEDS[speedIndex]}s`,
  };

  const handleSendMessage = async (userMood) => {
    if (!userMood.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: userMood }]);
    setInput('');
    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await fetch(`${API_BASE_URL}/api/get-recommendation?lat=${latitude}&lon=${longitude}&mood=${encodeURIComponent(userMood)}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Server error');
        }

        const data = await response.json();
        
        setWeatherData(data.weather);
        setLocation(data.location);

        const botResponse = (
          <div className="space-y-3">
            <p className="text-sm opacity-80">Based on your mood and the vibe in <strong>{data.location}</strong>:</p>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-md shadow-lg"
            >
              <p className="font-bold text-lg text-indigo-400">"{data.recommendation.song}"</p>
              <div className="flex justify-between items-center mt-1">
                <p className="text-sm text-slate-100 font-medium">by {data.recommendation.artist}</p>
                <Music className="w-4 h-4 text-indigo-400 opacity-60" />
              </div>
              <p className="text-xs italic text-slate-200 border-t border-white/10 mt-3 pt-3 flex items-start gap-2 leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 text-yellow-400 shrink-0" />
                <span>{data.recommendation.reason}</span>
              </p>
              
              {data.recommendation.spotifyUrl && (
                <a 
                  href={data.recommendation.spotifyUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-[#1DB954]/20 hover:bg-[#1DB954]/40 text-[#1DB954] rounded-lg text-xs font-bold transition-all border border-[#1DB954]/20"
                >
                  <Music className="w-3.5 h-3.5" />
                  Listen on Spotify
                </a>
              )}
            </motion.div>
          </div>
        );

        setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
        
        if (data.youtubeVideoId) {
          setYoutubeVideoId(data.youtubeVideoId);
        }

        if (data.colors && data.colors.length >= 3) {
          setColors(data.colors);
        }

      } catch (error) {
        console.error("API Error details:", error);
        
        const errorContent = (
          <div className="space-y-2">
            <p className="font-semibold text-red-400 flex items-center gap-2">
               ⚠️ Something went wrong:
            </p>
            <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 text-sm italic">
               "{error.message}"
            </div>
          </div>
        );

        setMessages(prev => [...prev, { role: 'bot', text: errorContent }]);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error("Geolocation Error:", error);
      setMessages(prev => [...prev, { role: 'bot', text: "I couldn't access your location. Using default vibes instead." }]);
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

  return (
    <div 
      className={`min-h-screen p-4 md:p-8 lg:p-12 flex items-center justify-center transition-all duration-[2000ms] ease-in-out ${isAnimationActive ? 'animation-active' : ''}`}
      style={backgroundStyle}
    >
      <div className="w-full max-w-7xl h-[85vh] flex flex-col lg:flex-row gap-6 relative">
        
        {/* Weather Insight (Floating Widget) */}
        {weatherData && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute -top-12 left-4 px-4 py-2 bg-white/10 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-4 shadow-2xl z-20"
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
          className="flex-1 flex flex-col ui-panel rounded-3xl overflow-hidden border border-white/10 relative z-10"
        >
          {/* Header */}
          <div className="p-5 ui-header flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 flex items-center justify-center shadow-inner">
                <Music className="text-indigo-300 w-6 h-6" />
              </div>
              <div>
                <h1 className="font-extrabold text-xl tracking-tight leading-none text-white drop-shadow-sm">AuraBeat</h1>
                <p className="text-[10px] uppercase tracking-widest text-indigo-300 font-black mt-1.5 opacity-90">AI Sound Curator</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSpeedIndex((prev) => (prev + 1) % ANIMATION_SPEEDS.length)}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white relative group"
                title={`Speed: ${['Slow', 'Medium', 'Fast'][speedIndex]}`}
              >
                <FastForward className="w-5 h-5" />
                <span className="absolute -bottom-1 -right-1 text-[8px] font-black bg-indigo-500 text-white px-1 rounded-sm opacity-100 transition-opacity">
                  {['S', 'M', 'F'][speedIndex]}
                </span>
              </button>
              <button 
                onClick={() => setIsAnimationActive(!isAnimationActive)}
                className="p-2.5 hover:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white"
                title="Toggle Animation"
              >
                {isAnimationActive ? <Zap className="w-5 h-5 text-yellow-400" /> : <ZapOff className="w-5 h-5" />}
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
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white uppercase shadow-lg shadow-indigo-500/30">
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
                      ? 'bg-indigo-600/90 text-white rounded-tr-none shadow-indigo-900/20' 
                      : 'bg-white/5 text-slate-100 rounded-tl-none border border-white/5'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start items-center gap-4"
              >
                <div className="bg-white/5 p-4 rounded-2xl rounded-tl-none border border-white/5 flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Generating vibe...</span>
                  </div>
                  <SoundWave />
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Mood Chips */}
          <div className="px-6 py-3 border-t border-white/5 flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
            {MOOD_CHIPS.map((chip) => (
              <motion.button
                key={chip}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSendMessage(chip)}
                className="mood-chip"
              >
                {chip}
              </motion.button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-6 bg-black/20 border-t border-white/5">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
              className="flex gap-3"
            >
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your current mood..."
                  className="w-full bg-slate-900/40 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all placeholder:text-slate-500 text-slate-200 shadow-inner"
                />
              </div>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-2xl transition-all shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setIsPlaylistOpen(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 rounded-2xl transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                title="Vibe my Playlist"
              >
                <Video className="w-5 h-5" />
              </motion.button>
            </form>
          </div>
        </motion.div>

        {/* Player Section */}
        <motion.div 
          layout
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={`lg:w-96 flex flex-col ui-panel rounded-3xl overflow-hidden border border-white/10 ${youtubeVideoId ? 'flex' : 'hidden lg:flex'}`}
        >
          <div className="p-5 ui-header flex items-center justify-between">
            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-400">Visual Experience</h2>
            {youtubeVideoId && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]"></div>}
          </div>
          <div className="flex-1 p-8 flex flex-col items-center justify-center">
            {youtubeVideoId ? (
              <motion.div 
                initial={{ scale: 0.9, rotateY: 20 }}
                animate={{ scale: 1, rotateY: 0 }}
                className="w-full relative group"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl border border-white/20">
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
          
          <div className="p-6 bg-black/10 border-t border-white/5 space-y-4">
             <div className="flex items-center justify-between text-xs font-black text-white uppercase tracking-wider">
                <span>Recent History</span>
                <History className="w-3.5 h-3.5" />
             </div>
             <div className="space-y-2">
                <div className="h-12 rounded-xl bg-black/40 border border-white/10 flex items-center px-4 text-[10px] italic text-slate-300 font-medium">No history yet...</div>
             </div>
          </div>
        </motion.div>

      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <HistorySidebar isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <PlaylistModal 
        isOpen={isPlaylistOpen} 
        onClose={() => setIsPlaylistOpen(false)} 
        onRecommendation={(data) => {
            setWeatherData(data.weather);
            setLocation(data.location);
            setYoutubeVideoId(data.youtubeVideoId);
            setColors(data.colors);
            const botResponse = (
              <div className="space-y-3">
                <p className="text-sm opacity-80 flex items-center gap-2"><Video className="w-3 h-3 text-red-500" /> From your playlist:</p>
                <motion.div 
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white/10 p-4 rounded-xl border border-white/20 backdrop-blur-md shadow-lg"
                >
                  <p className="font-bold text-lg text-red-400">"{data.recommendation.song}"</p>
                  <p className="text-sm text-slate-100 font-medium mt-1">by {data.recommendation.artist}</p>
                  <p className="text-xs italic text-slate-200 border-t border-white/10 mt-3 pt-3 flex items-start gap-2 leading-relaxed">
                    <Sparkles className="w-3.5 h-3.5 mt-0.5 text-yellow-400 shrink-0" />
                    <span>{data.recommendation.reason}</span>
                  </p>
                  <a 
                    href={data.recommendation.spotifyUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-[#1DB954]/20 hover:bg-[#1DB954]/40 text-[#1DB954] rounded-lg text-xs font-bold transition-all"
                  >
                    Listen on Spotify
                  </a>
                </motion.div>
              </div>
            );
            setMessages(prev => [...prev, { role: 'bot', text: botResponse }]);
        }}
      />
    </div>
  );
}

export default App;
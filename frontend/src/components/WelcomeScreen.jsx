/** AuraBeat Welcome Screen - Fresh Build */
import React from 'react';
// Removed complex motion for build safety test
import { Music, Zap, Sparkles, History, Github } from 'lucide-react';

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-indigo-500/30 transition-all">
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-white font-bold mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

export default function WelcomeScreen({ onGetStarted }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="max-w-4xl w-full text-center z-10">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Music size={32} className="text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white">
            AuraBeat
          </h1>
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
            Get Started <Sparkles size={20} />
          </button>
          
          <a 
            href="https://github.com/JaleedAhmad/music-recommender" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-8 py-4 bg-white/5 border border-white/10 rounded-full font-bold text-lg flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            <Github size={20} /> GitHub
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <FeatureCard 
            icon={<Zap className="text-yellow-400" />} 
            title="AI Recommendations" 
            desc="Powered by Gemini."
          />
          <FeatureCard 
            icon={<Sparkles className="text-blue-400" />} 
            title="Dynamic Visuals" 
            desc="The UI shifts colors."
          />
          <FeatureCard 
            icon={<History className="text-purple-400" />} 
            title="Vibe History" 
            desc="Save your moments."
          />
        </div>
      </div>
    </div>
  );
}

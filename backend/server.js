require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const app = express();

// Trust proxy for Render/Vercel (required for express-rate-limit)
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3001;

console.log("🚀 Starting AuraBeat Backend...");
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Port: ${PORT}`);

process.on('uncaughtException', (err) => {
    console.error('🔥 UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('🔥 UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    process.exit(1);
});

// --- Security Middleware ---
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}
app.use(helmet()); // Set security headers
app.use(mongoSanitize({ replaceWith: '_' })); // Prevent NoSQL injection
app.use(hpp()); // Prevent HTTP Parameter Pollution


// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after 15 minutes"
});
app.use('/api', limiter);

// CORS Configuration
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL // Will be added during deployment
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true
}));

app.use(express.json({ limit: '10kb' })); // Body parser with limit

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aurabeat')
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch(err => console.error("❌ MongoDB connection error:", err));

// --- Schemas ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const recommendationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    mood: String,
    location: String,
    weather: { temperature: Number, description: String },
    song: String,
    artist: String,
    reason: String,
    youtubeVideoId: String,
    colors: [String],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Recommendation = mongoose.model('Recommendation', recommendationSchema);

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid or expired token" });
        req.user = user;
        next();
    });
};

// --- Gemini API Helper Function with Retry Mechanism ---
async function callGemini(prompt, retryCount = 0) {
    const MAX_RETRIES = 3;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is not set in the .env file.");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.data.candidates && response.data.candidates.length > 0) {
            const content = response.data.candidates[0].content.parts[0].text;
            return JSON.parse(content);
        }
        throw new Error("AI model returned an empty or invalid response.");
    } catch (error) {
        if (error instanceof SyntaxError) {
            throw new Error("Gemini failed to return valid JSON.");
        }
        // Handle 429 Quota/Rate Limit error with retry
        if (error.response && error.response.status === 429 && retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 2000 + 10000; // Exponential backoff + 10s base
            console.log(`⚠️ Quota hit (429). Retrying in ${delay / 1000}s... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return callGemini(prompt, retryCount + 1);
        }

        console.error("Error calling Gemini API:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        throw new Error(`Failed to get a response from the AI model: ${error.message}`);
    }
}

// --- Groq API Helper Function ---
async function callGroq(prompt) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("Groq API key is not set in the .env file.");
    }
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    try {
        const response = await axios.post(url, {
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" }
        }, {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        if (response.data.choices && response.data.choices.length > 0) {
            const content = response.data.choices[0].message.content;
            return JSON.parse(content);
        }
        throw new Error("Groq model returned an empty or invalid response.");
    } catch (error) {
        if (error instanceof SyntaxError) {
             throw new Error("Groq failed to return valid JSON.");
        }
        throw new Error(`Failed to get a response from Groq: ${error.response ? JSON.stringify(error.response.data) : error.message}`);
    }
}

// --- LLM Fallback Chain ---
async function callLLM(prompt) {
  try {
    return await callGemini(prompt);
  } catch (e) {
    console.warn('Gemini failed, falling back to Groq:', e.message);
  }

  try {
    return await callGroq(prompt);
  } catch (e) {
    console.warn('Groq failed:', e.message);
  }

  throw new Error('All LLM providers failed');
}


// --- YouTube Helper Function ---
async function searchYouTubeVideo(song, artist) {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            console.error("YouTube API key is not set.");
            return null;
        }
        const searchQuery = encodeURIComponent(`${song} ${artist} official audio`);
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&key=${apiKey}&type=video&videoEmbeddable=true&regionCode=PK&maxResults=1`;

        const response = await axios.get(url);
        if (response.data.items && response.data.items.length > 0) {
            const videoId = response.data.items[0].id.videoId;
            console.log(`Found YouTube Video ID: ${videoId}`);
            return videoId;
        }
        console.log("No embeddable video found for the query.");
        return null;
    } catch (error) {
        console.error("YouTube search failed:", error.response ? error.response.data : error.message);
        return null;
    }
}

// --- YouTube Playlist Helper ---
async function getPlaylistItems(playlistId) {
    try {
        const apiKey = process.env.YOUTUBE_API_KEY;
        const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;
        const response = await axios.get(url);
        return response.data.items.map(item => item.snippet.title);
    } catch (error) {
        console.error("Error fetching playlist items:", error.message);
        return [];
    }
}

// --- Geocoding Helper Function ---
async function getCityName(lat, lon) {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MusicBot/1.0; +http://localhost:3000)' }
        });
        const address = response.data.address;
        return `${address.city || address.town || 'Unknown City'}, ${address.country || 'Unknown Country'}`;
    } catch (error) {
        console.error("Could not fetch city name:", error.message);
        return "an unknown location";
    }
}

// --- Weather Helper Function ---
function getWeatherDescription(code) {
    const descriptions = { 0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast', 45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain', 80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers' };
    return descriptions[code] || 'Unknown weather';
}

// --- Last.fm API Endpoint ---
app.get('/api/lastfm/:username', authenticateToken, async (req, res) => {
    try {
        const { username } = req.params;
        const apiKey = process.env.LASTFM_API_KEY;
        if (!apiKey) {
            console.warn("Last.fm API key is missing. Returning empty array.");
            return res.json([]);
        }
        
        const url = `http://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${encodeURIComponent(username)}&api_key=${apiKey}&format=json&limit=10`;
        const response = await axios.get(url);
        
        if (response.data && response.data.topartists && response.data.topartists.artist) {
            const artists = response.data.topartists.artist.map(a => a.name);
            return res.json(artists);
        }
        
        res.json([]);
    } catch (error) {
        console.error("Last.fm fetch error:", error.message);
        res.json([]); // Return empty array on failure as per spec
    }
});

// --- Main API Endpoint ---
app.post('/api/recommend', authenticateToken, async (req, res) => {
    try {
        const { mood, lat, lon, moodHistory, lastfmArtists, bpmPreference, energyPreference } = req.body;
        if (!lat || !lon || !mood) {
            return res.status(400).json({ message: "Latitude, longitude, and mood are required." });
        }

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
        const [weatherResponse, locationName] = await Promise.all([
            axios.get(weatherUrl),
            getCityName(lat, lon)
        ]);

        const temp = weatherResponse.data.current.temperature_2m;
        const weatherDescription = getWeatherDescription(weatherResponse.data.current.weather_code);

        const hour = new Date().getHours();
        const timeOfDay = hour < 6 ? 'late night' 
            : hour < 12 ? 'morning' 
            : hour < 17 ? 'afternoon' 
            : hour < 21 ? 'evening' 
            : 'night';

        const historyContext = moodHistory && moodHistory.length > 0 
            ? moodHistory.map(h => `${h.mood} -> ${h.song} by ${h.artist}`).join('\n') 
            : "No history yet";
            
        const artistsContext = lastfmArtists && lastfmArtists.length > 0
            ? lastfmArtists.join(', ')
            : "Not provided";

        const prompt = `You are a music curator AI. Given the following context, recommend ONE song.

User mood: ${mood}
Time of day: ${timeOfDay}
Weather: ${weatherDescription}, ${temp}°C
Location: ${locationName}

User's past mood->song history (most recent first, use for personalization):
${historyContext}

User's favorite artists from Last.fm (tailor recommendations toward these):
${artistsContext}

User energy preference: ${energyPreference || "not specified"}
User BPM preference: ${bpmPreference || "not specified"}

Respond ONLY with a valid JSON object — no markdown, no backticks, no explanation. Schema:
{
  "song": "string",
  "artist": "string",
  "reason": "string (2 sentences max)",
  "colors": { "primary": "hex", "secondary": "hex", "accent": "hex", "text": "hex" },
  "bpm": 120,
  "energy": "high | medium | low",
  "mood_tag": "string"
}`;

        const llmResponse = await callLLM(prompt);

        console.log("LLM Response JSON:", llmResponse);

        const song = llmResponse.song || "Unknown Song";
        const artist = llmResponse.artist || "Unknown Artist";
        const reason = llmResponse.reason || "Selected for your vibe.";
        const colors = llmResponse.colors ? [llmResponse.colors.primary, llmResponse.colors.secondary, llmResponse.colors.accent] : ['#0f2027','#203a43','#2c5364'];
        
        const youtubeVideoId = await searchYouTubeVideo(song, artist);

        const recommendationData = {
            weather: { temperature: temp, description: weatherDescription },
            recommendation: { 
                song: song, 
                artist: artist, 
                reason: reason,
                spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(song + " " + artist)}`
            },
            location: locationName,
            youtubeVideoId: youtubeVideoId,
            colors: colors,
            bpm: llmResponse.bpm || 120,
            energy: llmResponse.energy || "medium",
            mood_tag: llmResponse.mood_tag || "chill",
            aiColors: llmResponse.colors // Include the full colors object for the frontend
        };

        // Save to database if user is logged in
        if (req.user) {
            try {
                const newRec = new Recommendation({
                    userId: req.user.id,
                    mood,
                    location: locationName,
                    weather: { temperature: temp, description: weatherDescription },
                    song: song,
                    artist: artist,
                    reason,
                    youtubeVideoId,
                    colors
                });
                await newRec.save();
                console.log("✅ Recommendation saved for user:", req.user.username);
            } catch (dbError) {
                console.error("Failed to save recommendation:", dbError.message);
            }
        }

        res.json(recommendationData);

    } catch (error) {
        console.error("Error in backend:", error.message);
        res.status(500).json({ message: error.message });
    }
});
// --- Playlist Vibe Endpoint ---
app.post('/api/playlist/vibe', authenticateToken, async (req, res) => {
    try {
        const { playlistUrl, mood, lat, lon } = req.body;
        if (!playlistUrl || !mood) return res.status(400).json({ message: "Playlist URL and mood required" });

        // Extract playlist ID
        const playlistId = playlistUrl.includes('list=') ? playlistUrl.split('list=')[1].split('&')[0] : playlistUrl;
        
        const songList = await getPlaylistItems(playlistId);
        if (songList.length === 0) return res.status(400).json({ message: "Could not fetch songs from playlist" });

        const [weatherResponse, locationName] = await Promise.all([
            axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`),
            getCityName(lat, lon)
        ]);
        const temp = weatherResponse.data.current.temperature_2m;
        const weatherDescription = getWeatherDescription(weatherResponse.data.current.weather_code);

        const prompt = `You are a music curator. From this list of songs: [${songList.slice(0, 30).join(', ')}], pick the ONE song that best fits a mood of "${mood}" in ${locationName} (${temp}°C, ${weatherDescription}). Provide a poetic reason and three hex colors. Format: Song Title by Artist | Reason | #hex1,#hex2,#hex3`;

        const responseText = await callGeminiAPI(prompt);
        const parts = responseText.split('|').map(s => s.trim());
        const songRec = parts[0];
        const reason = parts[1] || "Selected from your playlist.";
        const colors = (parts[2] || '#0f2027,#203a43,#2c5364').split(',');

        const [song, artist] = songRec.split(' by ').map(s => s.trim());
        const youtubeVideoId = await searchYouTubeVideo(song, artist);

        const result = {
            weather: { temperature: temp, description: weatherDescription },
            recommendation: { 
                song: song || songRec, 
                artist: artist || "Unknown Artist", 
                reason,
                spotifyUrl: `https://open.spotify.com/search/${encodeURIComponent(songRec)}`
            },
            location: locationName,
            youtubeVideoId,
            colors
        };

        if (req.user) {
            const newRec = new Recommendation({
                userId: req.user.id,
                mood: `Playlist: ${mood}`,
                location: locationName,
                weather: { temperature: temp, description: weatherDescription },
                song: song || songRec,
                artist: artist || "Unknown Artist",
                reason,
                youtubeVideoId,
                colors
            });
            await newRec.save();
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Auth Routes ---
app.post('/api/auth/signup', async (req, res) => {
    try {
        let { username, password } = req.body;
        
        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input' });
        }
        
        username = username.trim();
        password = password.trim();
        
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
            return res.status(400).json({ message: "Username must be 3-30 characters long and contain only letters, numbers, and underscores." });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be at least 8 characters long." });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { username: user.username } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        let { username, password } = req.body;
        
        if (typeof username !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ message: 'Invalid input' });
        }
        
        username = username.trim();
        password = password.trim();
        
        if (!/^[a-zA-Z0-9_]{3,30}$/.test(username) || password.length < 8) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ message: 'Invalid username or password' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ message: 'Invalid username or password' });

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { username: user.username } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- History Route ---
app.get('/api/history', authenticateToken, async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    try {
        const history = await Recommendation.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Production Setup ---
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    const fs = require('fs');
    const distPath = path.join(__dirname, '../frontend/dist');
    
    if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.resolve(distPath, 'index.html'));
        });
    } else {
        console.log("ℹ️ Frontend dist folder not found. Serving API only.");
    }
}

// --- Global 404 JSON Handler ---
// This ensures that even if a route is missing, the frontend gets JSON, not HTML.
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found on this server.` });
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Backend server is running at http://localhost:${PORT}`);
});

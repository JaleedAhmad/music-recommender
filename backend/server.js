require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;
app.use(cors());

// --- Gemini API Helper Function with Retry Mechanism ---
async function callGeminiAPI(prompt, retryCount = 0) {
    const MAX_RETRIES = 3;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API key is not set in the .env file.");
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    console.log(`Calling Gemini API: ${url.replace(apiKey, 'REDACTED_KEY')}`);

    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: prompt }] }]
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        if (response.data.candidates && response.data.candidates.length > 0) {
            return response.data.candidates[0].content.parts[0].text;
        }
        throw new Error("AI model returned an empty or invalid response.");
    } catch (error) {
        // Handle 429 Quota/Rate Limit error with retry
        if (error.response && error.response.status === 429 && retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 2000 + 10000; // Exponential backoff + 10s base
            console.log(`⚠️ Quota hit (429). Retrying in ${delay / 1000}s... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return callGeminiAPI(prompt, retryCount + 1);
        }

        console.error("Error calling Gemini API:", error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        throw new Error(`Failed to get a response from the AI model: ${error.message}`);
    }
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

// --- Main API Endpoint ---
app.get('/api/get-recommendation', async (req, res) => {
    try {
        const { lat, lon, mood } = req.query;
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

        // --- UPDATED PROMPT FOR DYNAMIC COLORS & REASON ---
        const prompt = `You are a creative DJ and a color theorist. A user in ${locationName} (currently ${temp}°C and ${weatherDescription}) is feeling "${mood}". Suggest ONE perfect song for this exact vibe. Also, provide a short, poetic reason for your choice (max 15 words) and three elegant hex color codes that represent this atmosphere. IMPORTANT: Respond ONLY in this exact format, with pipes: Song Title by Artist | Reason | #hex1,#hex2,#hex3`;

        const responseText = await callGeminiAPI(prompt);
        const parts = responseText.split('|').map(s => s.trim());
        const songRecommendationText = parts[0];
        const reason = parts[1] || "Selected for your vibe.";
        const colorString = parts[2] || '#0f2027,#203a43,#2c5364'; // Default palette

        const colors = colorString.split(',');
        console.log("Color Palette from Gemini:", colors);

        const [song, artist] = songRecommendationText.split(' by ').map(s => s.trim());

        const youtubeVideoId = await searchYouTubeVideo(song, artist);

        res.json({
            weather: { temperature: temp, description: weatherDescription },
            recommendation: { song: song || songRecommendationText, artist: artist || "Unknown Artist", reason: reason },
            location: locationName,
            youtubeVideoId: youtubeVideoId,
            colors: colors,
        });

    } catch (error) {
        console.error("Error in backend:", error.message);
        res.status(500).json({ message: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`✅ Backend server is running at http://localhost:${PORT}`);
});

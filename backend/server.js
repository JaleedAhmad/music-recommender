// At the very top, load the environment variables from the .env file
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3001;
app.use(cors());

// --- NEW HELPER FUNCTION ---
// This function takes coordinates and returns a city name.
async function getCityName(lat, lon) {
    try {
        // We use a free reverse geocoding API
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
        const address = response.data.address;
        // Combine city and country for better context
        return `${address.city || address.town || 'Unknown City'}, ${address.country || 'Unknown Country'}`;
    } catch (error) {
        console.error("Could not fetch city name:", error.message);
        return "an unknown location"; // Provide a fallback
    }
}

// A helper function to describe the weather code
function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
        55: 'Dense drizzle', 61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers'
    };
    return descriptions[code] || 'Unknown weather';
}

app.get('/api/get-recommendation', async (req, res) => {
    try {
        const { lat, lon, mood } = req.query;

        if (!lat || !lon || !mood) {
            return res.status(400).json({ message: "Latitude, longitude, and mood are required." });
        }

        // --- Step 1: Get Weather AND Location Name ---
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`;
        
        // Run both API calls at the same time for efficiency
        const [weatherResponse, locationName] = await Promise.all([
            axios.get(weatherUrl),
            getCityName(lat, lon)
        ]);

        const temp = weatherResponse.data.current.temperature_2m;
        const weatherCode = weatherResponse.data.current.weather_code;
        const weatherDescription = getWeatherDescription(weatherCode);

        // --- Step 2: Call the Mistral AI API with the new, richer prompt ---
        const mistralApiKey = process.env.MISTRAL_API_KEY;
        if (!mistralApiKey) {
            throw new Error("Mistral API key is not set.");
        }

        // --- THE UPDATED PROMPT ---
        const prompt = `The user is in ${locationName}. The local weather is ${temp}°C and ${weatherDescription}. The user is feeling: "${mood}". Based on all this context (location, weather, and mood), suggest exactly one song that fits the vibe. You could even consider a song from that country or region if it fits. Provide only the song title and the artist, in the format: Song Title by Artist.`;

        const mistralResponse = await axios.post(
            'https://api.mistral.ai/v1/chat/completions',
            {
                model: 'mistral-small-latest', // Upgraded model for better reasoning
                messages: [{ role: 'user', content: prompt }],
            },
            {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mistralApiKey}` }
            }
        );

        const songRecommendationText = mistralResponse.data.choices[0].message.content;

        // --- Step 3: Parse the AI response and send it back ---
        const [song, artist] = songRecommendationText.split(' by ').map(s => s.trim());

        res.json({
            weather: { temperature: temp, description: weatherDescription },
            recommendation: { song: song || songRecommendationText, artist: artist || "Unknown Artist" },
            location: locationName // Also send location back to the frontend
        });

    } catch (error) {
        console.error("Error in backend:", error.response ? error.response.data : error.message);
        res.status(500).json({ message: "An error occurred while getting the recommendation." });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend server is running at http://localhost:${PORT}`);
});
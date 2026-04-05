require('dotenv').config();
const axios = require('axios');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    try {
        const response = await axios.get(url);
        console.log(JSON.stringify(response.data.models, null, 2));
    } catch (e) {
        console.log(`❌ Failed to list models: ${e.response ? JSON.stringify(e.response.data) : e.message}`);
    }
}

listModels();

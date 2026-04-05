require('dotenv').config();
const axios = require('axios');

async function testModel(modelName) {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
        const response = await axios.post(url, {
            contents: [{ parts: [{ text: "Hello" }] }]
        });
        console.log(`✅ ${modelName} works!`);
        return true;
    } catch (e) {
        console.log(`❌ ${modelName} failed: ${e.response ? e.response.data.error.message : e.message}`);
        return false;
    }
}

async function run() {
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'gemini-1.0-pro'
    ];
    for (const m of models) {
        await testModel(m);
    }
}

run();

const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function listModels() {
  try {
    // We can fetch from REST API directly since SDK might not expose listModels easily
    const axios = require('axios');
    const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const models = response.data.models;
    
    console.log("Available Gemini Flash/Pro Models:");
    for (const m of models) {
      if (m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent")) {
        console.log(`- ${m.name.replace('models/', '')}`);
      }
    }
  } catch (err) {
    console.error(err.message);
  }
}

listModels();

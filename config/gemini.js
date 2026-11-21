const { GoogleGenAI } = require('@google/genai');

let ai = null;

function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured. Please set it in your .env file.');
  }
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

function getModel() {
  return process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
}

function isApiKeyConfigured() {
  return !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
}

module.exports = { getClient, getModel, isApiKeyConfigured };

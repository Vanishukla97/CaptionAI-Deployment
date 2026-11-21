require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const captionRoutes = require('./routes/captionRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', captionRoutes);

// Error handling middleware (must be after routes)
app.use(errorHandler);

// Start server only when not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`CaptionAI server running on port ${PORT}`);
    console.log(`API key configured: ${!!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')}`);
    console.log(`Model: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}`);
  });
}

module.exports = app;

const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { generateCaption, healthCheck } = require('../controllers/captionController');

// POST /api/caption - Upload image and generate caption
router.post('/caption', upload.single('image'), generateCaption);

// GET /api/health - Health check endpoint
router.get('/health', healthCheck);

module.exports = router;

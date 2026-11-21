const { getClient, getModel, isApiKeyConfigured } = require('../config/gemini');

const CAPTION_PROMPTS = {
  short: 'Generate a concise description of this image in one or two sentences.',
  detailed:
    'Provide a detailed description of this image including visible objects, setting, activities, composition, and relevant visual details.',
  social:
    'Generate an engaging social media caption suitable for Instagram, including relevant emojis and hashtags.',
  accessibility:
    'Generate a concise, descriptive alt text for this image suitable for screen readers. Focus on conveying the essential visual information.',
  keywords:
    'Generate a list of relevant keywords and hashtags that describe this image. Format as a comma-separated list of keywords followed by relevant hashtags.',
};

const VALID_CAPTION_TYPES = Object.keys(CAPTION_PROMPTS);

async function generateCaption(req, res, next) {
  const startTime = Date.now();

  try {
    // Validate file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided. Please upload an image.',
        code: 'NO_FILE',
      });
    }

    // Validate caption type
    const captionType = req.body.captionType || 'short';
    if (!VALID_CAPTION_TYPES.includes(captionType)) {
      return res.status(400).json({
        success: false,
        error: `Invalid caption type: "${captionType}". Valid types: ${VALID_CAPTION_TYPES.join(', ')}`,
        code: 'INVALID_CAPTION_TYPE',
      });
    }

    // Check API key
    if (!isApiKeyConfigured()) {
      return res.status(500).json({
        success: false,
        error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.',
        code: 'API_KEY_MISSING',
      });
    }

    // Prepare image data
    const base64Image = req.file.buffer.toString('base64');
    const promptText = CAPTION_PROMPTS[captionType];

    // Call Gemini API
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: getModel(),
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: req.file.mimetype,
          },
        },
        promptText,
      ],
    });

    const caption = response.text;

    if (!caption) {
      return res.status(500).json({
        success: false,
        error: 'AI model returned an empty response. Please try again.',
        code: 'EMPTY_RESPONSE',
      });
    }

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      captionType,
      generatedCaption: caption,
      imageName: req.file.originalname,
      processingTime,
    });
  } catch (error) {
    // Handle specific API errors
    if (error.status === 429 || error.code === 429) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait a moment and try again.',
        code: 'RATE_LIMIT',
      });
    }

    if (error.status === 503 || error.code === 503) {
      return res.status(503).json({
        success: false,
        error: 'AI service is temporarily unavailable. Please try again later.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    // Pass other errors to the error handler
    next(error);
  }
}

function healthCheck(req, res) {
  res.status(200).json({
    status: 'ok',
    server: 'running',
    apiConfigured: isApiKeyConfigured(),
    model: getModel(),
  });
}

module.exports = { generateCaption, healthCheck };

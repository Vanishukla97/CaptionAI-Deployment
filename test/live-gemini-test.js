require('dotenv').config();
const fs = require('fs');
const path = require('path');
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

async function testLiveGemini(imagePath) {
  console.log('====================================================');
  console.log('CaptionAI — Live Gemini API Multimodal Verification');
  console.log('====================================================');
  console.log('Configured Model:', getModel());
  console.log('API Key Configured:', isApiKeyConfigured());
  console.log('Test Image:', imagePath);

  if (!fs.existsSync(imagePath)) {
    console.error('Image file does not exist at:', imagePath);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';

  const ai = getClient();
  const results = {};

  const modes = ['short', 'detailed', 'social', 'accessibility', 'keywords'];

  for (const mode of modes) {
    console.log(`\n----------------------------------------------------`);
    console.log(`Testing Mode: [${mode.toUpperCase()}]`);
    console.log(`Prompt: "${CAPTION_PROMPTS[mode]}"`);
    const startTime = Date.now();

    try {
      const response = await ai.models.generateContent({
        model: getModel(),
        contents: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          CAPTION_PROMPTS[mode],
        ],
      });

      const elapsed = Date.now() - startTime;
      const caption = response.text ? response.text.trim() : '';

      results[mode] = {
        success: true,
        caption,
        elapsed,
      };

      console.log(`Status: SUCCESS (${elapsed}ms)`);
      console.log(`Generated Output:\n${caption}`);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      results[mode] = {
        success: false,
        error: err.message,
        code: err.status || err.code || 'UNKNOWN',
        elapsed,
      };

      console.error(`Status: FAILED (${elapsed}ms)`);
      console.error(`Error Code:`, results[mode].code);
      console.error(`Error Message:`, err.message);
    }
  }

  console.log('\n====================================================');
  console.log('Live Verification Summary');
  console.log('====================================================');
  let passCount = 0;
  for (const [m, res] of Object.entries(results)) {
    const icon = res.success ? 'PASS' : 'FAIL';
    if (res.success) passCount++;
    console.log(`[${icon}] ${m}: ${res.success ? `${res.elapsed}ms` : res.error}`);
  }

  console.log(`Total: ${passCount}/${modes.length} passed.`);
  return results;
}

if (require.main === module) {
  const defaultImage = path.join(__dirname, 'sample_golden_retriever.jpg');
  testLiveGemini(defaultImage);
}

module.exports = { testLiveGemini };

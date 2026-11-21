const request = require('supertest');
const path = require('path');
const fs = require('fs');

// Minimal valid 1x1 JPEG buffer
const VALID_JPEG_BUFFER = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
  0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
  0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
  0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
  0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
  0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
  0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
  0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
  0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
  0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
  0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
  0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
  0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
  0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
  0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
  0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
  0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
  0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
  0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
  0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
  0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
  0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
  0x00, 0x00, 0x3F, 0x00, 0x7B, 0x94, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00,
  0xFF, 0xD9
]);

// Mock Gemini config module
const mockGenerateContent = jest.fn();
jest.mock('../config/gemini', () => ({
  getClient: jest.fn(() => ({
    models: {
      generateContent: mockGenerateContent,
    },
  })),
  getModel: jest.fn(() => 'gemini-2.5-flash'),
  isApiKeyConfigured: jest.fn(() => true),
}));

const geminiConfig = require('../config/gemini');
const app = require('../server');

describe('CaptionAI — Automated API Test Suite', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    geminiConfig.isApiKeyConfigured.mockReturnValue(true);
    mockGenerateContent.mockResolvedValue({
      text: 'A clean and detailed test description of the image.',
    });
  });

  // 1. GET /api/health
  describe('1. Health Check Endpoint (GET /api/health)', () => {
    test('should return 200 with server status, apiConfigured, and model', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.server).toBe('running');
      expect(res.body.apiConfigured).toBe(true);
      expect(res.body.model).toBe('gemini-2.5-flash');
    });
  });

  // 2. API Key Protection
  describe('2. API Key Protection', () => {
    test('health endpoint should never expose API key or secret values', async () => {
      const res = await request(app).get('/api/health');
      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain('AIza');
      expect(res.body).not.toHaveProperty('apiKey');
      expect(res.body).not.toHaveProperty('key');
      expect(res.body).not.toHaveProperty('GEMINI_API_KEY');
    });
  });

  // 3. Frontend Static Asset Loading
  describe('3. Frontend Static Asset Loading', () => {
    test('should serve index.html at root GET /', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/html/);
      expect(res.text).toContain('CaptionAI');
      expect(res.text).toContain('Creative Image Intelligence Studio');
    });

    test('should serve CSS stylesheet at GET /css/style.css', async () => {
      const res = await request(app).get('/css/style.css');
      expect(res.status).toBe(200);
      expect(res.text).toContain('--bg-primary: #F7F5F0');
      expect(res.text).toContain('--accent-primary: #B96F52');
    });

    test('should serve JavaScript app logic at GET /js/app.js', async () => {
      const res = await request(app).get('/js/app.js');
      expect(res.status).toBe(200);
      expect(res.text).toContain('CaptionAI');
      expect(res.text).toContain('DOMContentLoaded');
    });
  });

  // 4. Missing Image Upload
  describe('4. Missing Image Upload Validation', () => {
    test('should return 400 when no image is uploaded', async () => {
      const res = await request(app)
        .post('/api/caption')
        .field('captionType', 'short');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('NO_FILE');
      expect(res.body.error).toMatch(/no image file provided/i);
    });
  });

  // 5. Unsupported Image Formats
  describe('5. Unsupported Image Formats', () => {
    test('should return 400 when an unsupported file type is uploaded (e.g. text/plain)', async () => {
      const res = await request(app)
        .post('/api/caption')
        .attach('image', Buffer.from('Plain text file content'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        .field('captionType', 'short');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_FILE_TYPE');
    });

    test('should reject PDF uploads', async () => {
      const res = await request(app)
        .post('/api/caption')
        .attach('image', Buffer.from('%PDF-1.4 mock content'), {
          filename: 'document.pdf',
          contentType: 'application/pdf',
        })
        .field('captionType', 'detailed');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_FILE_TYPE');
    });
  });

  // 6. Oversized Image Rejection
  describe('6. Oversized Image Rejection (>5 MB)', () => {
    test('should return 400 when uploaded image exceeds 5 MB limit', async () => {
      // 5.2 MB buffer
      const oversizedBuffer = Buffer.alloc(5.2 * 1024 * 1024, 0xFF);

      const res = await request(app)
        .post('/api/caption')
        .attach('image', oversizedBuffer, {
          filename: 'giant.jpg',
          contentType: 'image/jpeg',
        })
        .field('captionType', 'short');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FILE_TOO_LARGE');
      expect(res.body.error).toMatch(/maximum file size is 5mb/i);
    });
  });

  // 7. Invalid Caption Type
  describe('7. Invalid Caption Type Validation', () => {
    test('should return 400 when an unsupported captionType is supplied', async () => {
      const res = await request(app)
        .post('/api/caption')
        .attach('image', VALID_JPEG_BUFFER, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('captionType', 'unsupported_mode_xyz');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_CAPTION_TYPE');
      expect(res.body.error).toMatch(/invalid caption type/i);
    });
  });

  // 8. Valid Request Handling (All 5 Modes)
  describe('8. Valid Request Handling (All 5 Caption Modes)', () => {
    const modes = [
      { mode: 'short', name: 'Short Caption' },
      { mode: 'detailed', name: 'Detailed Description' },
      { mode: 'social', name: 'Social Media Caption' },
      { mode: 'accessibility', name: 'Accessibility Alt Text' },
      { mode: 'keywords', name: 'Keywords and Tags' },
    ];

    test.each(modes)('should successfully process mode "$mode"', async ({ mode }) => {
      mockGenerateContent.mockResolvedValueOnce({
        text: `Generated ${mode} caption for test image.`,
      });

      const res = await request(app)
        .post('/api/caption')
        .attach('image', VALID_JPEG_BUFFER, {
          filename: 'sample.jpg',
          contentType: 'image/jpeg',
        })
        .field('captionType', mode);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.captionType).toBe(mode);
      expect(res.body.generatedCaption).toContain(`Generated ${mode} caption`);
      expect(res.body.imageName).toBe('sample.jpg');
      expect(typeof res.body.processingTime).toBe('number');
    });
  });

  // 9. Missing API Key Handling
  describe('9. Missing API Key Handling', () => {
    test('should return 500 with API_KEY_MISSING if API key is unconfigured', async () => {
      geminiConfig.isApiKeyConfigured.mockReturnValueOnce(false);

      const res = await request(app)
        .post('/api/caption')
        .attach('image', VALID_JPEG_BUFFER, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('captionType', 'short');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('API_KEY_MISSING');
      expect(res.body.error).toMatch(/api key is not configured/i);
    });
  });

  // 10. Gemini API Error Handling (Rate Limit & Service Unavailable)
  describe('10. Gemini API Error Handling', () => {
    test('should handle HTTP 429 rate limit correctly', async () => {
      const rateLimitError = new Error('Resource has been exhausted');
      rateLimitError.status = 429;
      mockGenerateContent.mockRejectedValueOnce(rateLimitError);

      const res = await request(app)
        .post('/api/caption')
        .attach('image', VALID_JPEG_BUFFER, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('captionType', 'short');

      expect(res.status).toBe(429);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('RATE_LIMIT');
      expect(res.body.error).toMatch(/rate limit/i);
    });

    test('should handle HTTP 503 service unavailable correctly', async () => {
      const serviceError = new Error('Service Unavailable');
      serviceError.status = 503;
      mockGenerateContent.mockRejectedValueOnce(serviceError);

      const res = await request(app)
        .post('/api/caption')
        .attach('image', VALID_JPEG_BUFFER, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('captionType', 'short');

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('SERVICE_UNAVAILABLE');
      expect(res.body.error).toMatch(/temporarily unavailable/i);
    });
  });

  // 11. Response Structure Validation
  describe('11. Response Structure Validation', () => {
    test('successful response has exact required contract', async () => {
      const res = await request(app)
        .post('/api/caption')
        .attach('image', VALID_JPEG_BUFFER, {
          filename: 'test.png',
          contentType: 'image/png',
        })
        .field('captionType', 'social');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        captionType: 'social',
        generatedCaption: expect.any(String),
        imageName: 'test.png',
        processingTime: expect.any(Number),
      });
    });
  });

  // 12. Credential Leakage Prevention
  describe('12. Credential Leakage Prevention in Errors', () => {
    test('generic server error message must sanitize any leaked API key patterns', async () => {
      const leakedKeyError = new Error('Connection failed to AIzaSyDummyKey1234567890abcdefghijklmn');
      leakedKeyError.statusCode = 500;
      mockGenerateContent.mockRejectedValueOnce(leakedKeyError);

      const res = await request(app)
        .post('/api/caption')
        .attach('image', VALID_JPEG_BUFFER, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field('captionType', 'short');

      const responseString = JSON.stringify(res.body);
      expect(responseString).not.toContain('AIzaSyDummyKey1234567890abcdefghijklmn');
      expect(res.body.success).toBe(false);
    });
  });
});

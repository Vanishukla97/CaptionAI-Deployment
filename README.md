# CaptionAI — Cloud Deployment Studio

**Experiment 13: Deploy a full-stack AI-enabled web application using GitHub, Vercel/Render/Netlify, and implement version control.**

**Project Name:** CaptionAI — Cloud Deployment  
**Project Directory:** `Experiment_13_CaptionAI_Deployment`  
**Base Application:** `Experiment_12_AI_Image_Captioning`

CaptionAI is a production-ready, full-stack AI-enabled image captioning web application built with Node.js, Express, and Google Gemini AI using the official `@google/genai` SDK. It features an editorial aesthetic (warm ivory, charcoal, and terracotta) and delivers multimodal vision reasoning for generating five distinct caption styles without disclosing secret credentials.

---

## 1. Project Overview & Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Client Browser                       │
│  - Vanilla JavaScript Single Page App (SPA)            │
│  - Bootstrap 5.3.3 + Custom Editorial Design System    │
│  - Drag-and-drop Image Upload & Preview                │
│  - Five Caption Modes & In-Place Editing               │
│  - Client-side LocalStorage Saved Library              │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / REST API (JSON & Multipart)
                           ▼
┌────────────────────────────────────────────────────────┐
│               Express.js Web Server                    │
│  - Port dynamic resolution (process.env.PORT || 3000)   │
│  - In-memory upload handling via Multer (5 MB limit)   │
│  - CORS & Centralized Error Handler (Key Redaction)    │
│  - Static Asset Delivery (`public/`)                   │
└──────────────────────────┬─────────────────────────────┘
                           │ @google/genai SDK (v1.0.0)
                           ▼
┌────────────────────────────────────────────────────────┐
│               Google Gemini AI API                     │
│  - Multimodal Vision Reasoning (gemini-3.1-flash-lite) │
│  - Inline Base64 image payload transmission            │
│  - Secure API Key via process.env.GEMINI_API_KEY       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Key Features

- **Five Multimodal Caption Modes:**
  1. **Short Caption:** Concise 1–2 sentence description of image subject and context.
  2. **Detailed Description:** Comprehensive analysis covering subject, setting, activities, lighting, depth, and composition.
  3. **Social Media Caption:** High-engagement copy with relevant emojis and targeted hashtags.
  4. **Accessibility Alt Text:** Screen-reader-optimized visual descriptions for WCAG accessibility.
  5. **Keywords & Tags:** Comma-separated keyword list and search tags.
- **Editorial UI/UX Design System:**
  - Responsive layout across desktop, laptop, tablet, and mobile.
  - Warm Ivory (`#F7F5F0`), Deep Charcoal (`#252923`), Terracotta (`#B96F52`), and Sage (`#87917B`).
  - Google Fonts: `DM Serif Display` and `Inter`.
- **Production-Ready Backend:**
  - Zero disk-write upload processing via Multer memory storage.
  - Centralized error handling with automatic API key sanitization (`[REDACTED]`).
  - Health check endpoint `/api/health` reporting status without exposing secret keys.
  - Dynamic port binding for cloud hosting platforms (`process.env.PORT`).

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3, Bootstrap 5.3.3, Bootstrap Icons 1.11.3, Vanilla JavaScript (ES6+) |
| **Backend** | Node.js (>=18.0.0), Express.js 4.21.0, Multer 1.4.5-lts.1, CORS, Dotenv |
| **AI Integration** | Official `@google/genai` SDK (^1.0.0), Gemini 3.1 Flash Lite Multimodal Vision |
| **Testing** | Jest 29.7.0, Supertest 7.0.0, Puppeteer 25.18.1 |
| **Deployment Targets** | GitHub (Version Control), Render / Vercel / Netlify / Railway |

---

## 4. Project Structure

```
Experiment_13_CaptionAI_Deployment/
├── config/
│   └── gemini.js                # Gemini client initialization & model resolution
├── controllers/
│   └── captionController.js     # Image caption generator & health check handlers
├── middleware/
│   ├── errorHandler.js          # Central error middleware with credential sanitization
│   └── uploadMiddleware.js      # Multer memory storage & MIME/size validation
├── public/
│   ├── css/
│   │   └── style.css            # Editorial design system stylesheet
│   ├── js/
│   │   └── app.js               # Frontend SPA application logic & DOM rendering
│   ├── favicon.svg              # Studio terracotta SVG icon
│   └── index.html               # Semantic HTML5 single-page application
├── routes/
│   └── captionRoutes.js         # API route definitions
├── test/
│   ├── screenshots/             # Browser verification screenshots
│   ├── api.test.js              # Jest + Supertest 20-test automated suite
│   ├── browser-test.js          # Puppeteer real-browser end-to-end verification
│   ├── live-gemini-test.js      # Real multimodal Gemini API verification script
│   └── sample_golden_retriever.jpg # Actual photographic test image
├── .env.example                 # Environment configuration template (safe to commit)
├── .gitignore                   # Excludes node_modules, .env, and logs
├── package.json                 # Project manifest, scripts, engines, and dependencies
├── package-lock.json            # Deterministic dependency tree lockfile
├── server.js                    # Express application entry point
└── README.md                    # Project documentation & deployment guide
```

---

## 5. Local Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **Google Gemini API Key**: Obtainable from [Google AI Studio](https://aistudio.google.com/)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a local `.env` file (do NOT commit this file):
```bash
cp .env.example .env
```

Configure your `.env` file:
```ini
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
PORT=3000
```

### Step 3: Run the Application Locally
```bash
npm start
```
The server will start on `http://localhost:3000`.

---

## 6. Cloud Deployment Guide

### Deployment Prerequisites
1. **GitHub Repository**: A private or public GitHub repository containing this codebase (excluding `.env` and `node_modules`).
2. **Gemini API Key**: Your API key from Google AI Studio.
3. **Cloud Host Account**: An account on [Render](https://render.com), [Railway](https://railway.app), or [Vercel](https://vercel.com).

---

### Option A: Deploying to Render (Recommended for Express Apps)

Render natively supports Node.js web services with automatic TLS, git-push continuous deployment, and environment variable management.

1. **Sign in to Render** ([dashboard.render.com](https://dashboard.render.com)).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository (`Experiment_13_CaptionAI_Deployment` or your repository name).
4. Configure the Web Service settings:
   - **Name**: `captionai-app` (or your chosen name)
   - **Region**: Choose the closest region (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (if repo root) or specify folder
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan Type**: `Free`
5. Configure **Environment Variables** in the Render Dashboard:
   - `GEMINI_API_KEY`: `<Your Google Gemini API Key>`
   - `GEMINI_MODEL`: `gemini-3.1-flash-lite`
   - `NODE_ENV`: `production`
   *(Note: Render automatically injects `PORT`, and Express listens on `process.env.PORT` automatically).*
6. Click **Create Web Service**.
7. Render will build and deploy the app. Once live, test `https://<your-service-name>.onrender.com/api/health`.

---

### Option B: Deploying to Vercel

For serverless Express deployment on Vercel:
1. Ensure a `vercel.json` file is configured if deploying as serverless rewrites:
   ```json
   {
     "version": 2,
     "builds": [
       { "src": "server.js", "use": "@vercel/node" }
     ],
     "routes": [
       { "src": "/(.*)", "dest": "server.js" }
     ]
   }
   ```
2. Import the GitHub repository into the Vercel dashboard.
3. Add `GEMINI_API_KEY` and `GEMINI_MODEL` under **Environment Variables**.
4. Click **Deploy**.

---

### Option C: Deploying to Railway

1. Go to [railway.app](https://railway.app) and create a new project.
2. Select **Deploy from GitHub repo**.
3. Set Variables:
   - `GEMINI_API_KEY`: `<Your Google Gemini API Key>`
   - `GEMINI_MODEL`: `gemini-3.1-flash-lite`
4. Railway detects Node.js and executes `npm start`.

---

## 7. Version Control & Git Initialization Workflow

When ready to initialize version control and push to GitHub, follow these exact steps:

```bash
# 1. Initialize local Git repository
git init

# 2. Verify .gitignore is active and .env is excluded
git status

# 3. Stage all tracked files
git add .

# 4. Verify no secret or unwanted files are staged
git status

# 5. Create initial deployment commit
git commit -m "feat: initial commit of CaptionAI cloud deployment application"

# 6. Set main branch
git branch -M main

# 7. Connect remote GitHub repository (replace with your repo URL)
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 8. Push to GitHub
git push -u origin main
```

---

## 8. API Reference

### `POST /api/caption`
Upload an image and receive an AI-generated description.
- **Header:** `Content-Type: multipart/form-data`
- **Fields:**
  - `image` (binary file, JPEG/PNG/WebP, max 5 MB)
  - `captionType` (`short` | `detailed` | `social` | `accessibility` | `keywords`)

### `GET /api/health`
Health check endpoint used by uptime monitors and deployment platforms.
- **Response:**
  ```json
  {
    "status": "ok",
    "server": "running",
    "apiConfigured": true,
    "model": "gemini-3.1-flash-lite"
  }
  ```

---

## 9. Security & Production Checklist

- [x] **No hardcoded secrets**: API keys read solely from `process.env.GEMINI_API_KEY`.
- [x] **Strict `.gitignore`**: `.env`, `node_modules`, and local logs excluded.
- [x] **Dynamic PORT binding**: `process.env.PORT || 3000` allows hosting platforms to bind their assigned port.
- [x] **Production start script**: `npm start` executes `node server.js`.
- [x] **Error redaction**: Centralized error middleware sanitizes API key patterns before returning errors.
- [x] **In-memory storage**: Uploads are held in RAM during processing and never leak to permanent server storage.
- [x] **Health check route**: Accessible at `/api/health` for cloud container health checks.

---

## 10. License
MIT License. Built for Experiment 13 Cloud Deployment.

# 🔍 LivingAI — AI Image Analysis with Qwen2.5-VL

A modern web application that uses **Qwen2.5-VL** (Apache 2.0 licensed) to analyze images and extract text, descriptions, and visual details.

![Qwen2.5-VL](https://img.shields.io/badge/Model-Qwen2.5--VL-purple)
![License](https://img.shields.io/badge/License-Apache%202.0-blue)
![Python](https://img.shields.io/badge/Python-3.8%2B-green)

## ✨ Features

- 📸 **Drag & Drop** image upload with preview
- 🤖 **Qwen2.5-VL** vision-language model for analysis
- 📝 **Text Extraction** (OCR) from images
- 🔍 **Image Description** with AI
- 🎨 **Premium Dark Mode** UI with glassmorphism
- ⌨️ **Keyboard Shortcuts** (Ctrl+Enter to analyze)
- 📋 **Copy to Clipboard** results
- 💡 **Smart Prompt Suggestions**

## 🚀 Quick Start

### 1. Get a Free HuggingFace API Token

1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Create a free account (if you don't have one)
3. Click **"New token"** → give it a name → select **"Read"** access
4. Copy the token

### 2. Set Up the Backend

```bash
cd backend

# Create .env file with your token
cp .env.example .env
# Edit .env and replace 'your_huggingface_token_here' with your actual token

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
```

### 3. Open the App

Navigate to **http://localhost:5001** in your browser. That's it! 🎉

## 📁 Project Structure

```
qwen-vision-app/
├── backend/
│   ├── app.py              # Flask API server
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variable template
│   └── .env                # Your API token (create from .env.example)
├── frontend/
│   ├── index.html          # Main page
│   ├── styles.css          # Premium dark-mode styling
│   └── script.js           # Image upload & API logic
└── README.md
```

## 🛠️ API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serves the frontend |
| `/api/health` | GET | Health check & API status |
| `/api/analyze` | POST | Analyze an image (multipart form) |

### `POST /api/analyze`

**Form Data:**
- `image` (file, required) — Image file (PNG, JPG, GIF, WebP, BMP)
- `prompt` (string, optional) — Custom analysis prompt

**Response:**
```json
{
  "success": true,
  "result": "The image shows...",
  "model": "Qwen/Qwen2.5-VL-7B-Instruct",
  "prompt": "Describe this image in detail..."
}
```

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "API token not configured" | Add your token to `.env` file |
| "Model is loading" | Wait 1-2 minutes and retry (first request cold starts the model) |
| "Rate limit exceeded" | Wait a moment and try again |
| "Cannot connect to server" | Make sure `python app.py` is running |

## 📜 License

This project uses **Qwen2.5-VL** which is licensed under **Apache 2.0**.

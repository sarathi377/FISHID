# Google Gemini API Setup Guide

This app now uses **Google's Gemini API** for:
- Fish image identification (using Gemini 2.5 Flash with vision)
- Finding nearby fishing shops
- Chat assistance

## Setup Instructions

1. **Get a Google AI API Key:**
   - Go to https://aistudio.google.com/
   - Sign up or log in
   - Click "Get API key"
   - Create a new API key (format: `AIzaSy...`)

2. **Create a `.env` file in the project root:**
   ```
   VITE_GOOGLE_API_KEY=AIzaSy...your-actual-api-key-here
   ```

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

## API Configuration

- **Model:** `gemini-2.5-flash`
- **Library:** `@google/generative-ai`

## Features

✅ **Fish Identification** - Upload an image and get detailed fish species information
✅ **Shop Finder** - Find nearby fishing equipment stores
✅ **Chat Assistant** - Multilingual fishing and marine advice

## Notes

- The API key is stored in environment variables and never exposed in client-side code
- All API calls include proper error handling
- The app will show an error message if the API key is not configured

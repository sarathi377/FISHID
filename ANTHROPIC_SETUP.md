# Anthropic API Setup Guide

This app now uses **Anthropic's Claude API** for:
- Fish image identification (using Claude 3.5 Sonnet with vision)
- Finding nearby fishing shops
- Chat assistance

## Setup Instructions

1. **Get an Anthropic API Key:**
   - Go to https://console.anthropic.com/
   - Sign up or log in
   - Navigate to API Keys section
   - Create a new API key (format: `sk-ant-api03-...`)

2. **Create a `.env` file in the project root:**
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-api-key-here
   ```

3. **Restart the development server:**
   ```bash
   npm run dev
   ```

## API Configuration

- **Model:** `claude-3-5-sonnet-20241022`
- **Endpoint:** `https://api.anthropic.com/v1/messages`
- **Headers:**
  - `x-api-key`: Your API key
  - `anthropic-version`: `2023-06-01`

## Features

✅ **Fish Identification** - Upload an image and get detailed fish species information
✅ **Shop Finder** - Find nearby fishing equipment stores
✅ **Chat Assistant** - Multilingual fishing and marine advice

## Notes

- The API key is stored in environment variables and never exposed in client-side code
- All API calls include proper error handling
- The app will show an error message if the API key is not configured


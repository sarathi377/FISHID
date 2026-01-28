# Quick Setup Guide - Fix API Errors

## ⚠️ Common Errors Fixed

The app now has better error handling that will guide you to fix issues:

### Error: "API key not configured"
**Solution:** Create a `.env` file in the project root with:
```
VITE_GOOGLE_API_KEY=AIzaSy...your-actual-key-here
```

### Error: "Invalid API key"
**Solution:** 
1. Get your API key from: https://aistudio.google.com/
2. Make sure it starts with `AIzaSy`
3. Update the `.env` file
4. Restart the dev server: `npm run dev`

### Error: "Network error"
**Solution:** Check your internet connection

### Error: "Rate limit exceeded"
**Solution:** Wait a moment and try again

## 🚀 Quick Fix Steps

1. **Check if .env file exists:**
   ```bash
   # In PowerShell
   Test-Path .env
   ```

2. **Create .env file if missing:**
   ```bash
   # Create file with your API key
   echo "VITE_GOOGLE_API_KEY=AIzaSy_YOUR_KEY_HERE" > .env
   ```

3. **Restart the server:**
   ```bash
   npm run dev
   ```

4. **Verify the API key is loaded:**
   - The app will now show helpful error messages if the key is missing or invalid
   - Check browser console (F12) for detailed error messages

## ✅ What's Fixed

- ✅ Better error messages that guide you to solutions
- ✅ Detects missing or placeholder API keys
- ✅ Handles network errors gracefully
- ✅ Provides specific error messages for different API errors (401, 429, 500, etc.)
- ✅ Better JSON parsing with fallbacks
- ✅ Improved chat error handling

## 📝 Next Steps

1. Get your API key from https://aistudio.google.com/
2. Add it to `.env` file
3. Restart the server
4. Try uploading a fish image again!

# How to Set Up Your Anthropic API Key

## Step-by-Step Instructions

### Step 1: Get Your API Key

1. Go to: **https://console.anthropic.com/**
2. Sign in or create an account
3. Navigate to **API Keys** section
4. Click **Create Key** or copy an existing key
5. Your key will look like: `sk-ant-api03-R2D2...igAA`

### Step 2: Add Key to .env File

1. Open the `.env` file in your project root folder
2. Find this line:
   ```
   VITE_ANTHROPIC_API_KEY=YOUR_API_KEY_HERE
   ```
3. Replace `YOUR_API_KEY_HERE` with your actual API key:
   ```
   VITE_ANTHROPIC_API_KEY=sk-ant-api03-R2D2...igAA
   ```
4. Save the file

### Step 3: Restart the Server

After adding your API key, you MUST restart the development server:

1. Stop the current server (Press `Ctrl + C` in the terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

### Step 4: Test It

1. Open http://localhost:5173
2. Upload a fish image
3. The identification should now work!

## Quick Command (PowerShell)

If you want to set it via command line:

```powershell
# Replace YOUR_ACTUAL_KEY with your real API key
$apiKey = "sk-ant-api03-YOUR_ACTUAL_KEY"
"VITE_ANTHROPIC_API_KEY=$apiKey" | Out-File -FilePath .env -Encoding utf8 -Force
```

## Troubleshooting

### Error: "API key not configured"
- Make sure the `.env` file exists in the project root
- Check that the key doesn't contain `YOUR_API_KEY_HERE` or `your-key`
- Restart the server after adding the key

### Error: "Invalid API key"
- Verify your key starts with `sk-ant-api03-`
- Make sure there are no extra spaces
- Check that the key is active in your Anthropic console

### Still not working?
1. Check browser console (F12) for detailed errors
2. Verify the `.env` file is in the correct location (project root)
3. Make sure you restarted the server after adding the key


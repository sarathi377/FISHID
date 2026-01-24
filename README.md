# Fish Identifier App

AI-powered fish identification and fishing equipment shop finder application.

## 📁 Main Files

### Core Application Files:
- **`src/App.tsx`** - Main React component (Fish identification, shop finder, chat)
- **`src/main.tsx`** - Application entry point (renders React app)
- **`index.html`** - HTML template
- **`src/index.css`** - Global styles with Tailwind CSS

### Configuration Files:
- **`package.json`** - Dependencies and npm scripts
- **`vite.config.ts`** - Vite build configuration
- **`tsconfig.json`** - TypeScript configuration
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`postcss.config.js`** - PostCSS configuration
- **`.env`** - Environment variables (API keys) - **CREATE THIS FILE**

## 🚀 How to Run Commands

### 1. Install Dependencies (First Time Only)
```bash
npm install
```

### 2. Set Up API Key
Create a `.env` file in the project root:
```
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-api-key-here
```

### 3. Start Development Server
```bash
npm run dev
```
- Opens at: **http://localhost:5173**
- Hot reload enabled
- Automatically refreshes on file changes

### 4. Build for Production
```bash
npm run build
```
- Creates optimized production build in `dist/` folder
- TypeScript compilation + Vite bundling

### 5. Preview Production Build
```bash
npm run preview
```
- Serves the production build locally
- Test before deploying

## 📋 All Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 🔧 Project Structure

```
k/
├── src/
│   ├── App.tsx          # Main application component
│   ├── main.tsx          # Entry point
│   ├── index.css        # Global styles
│   └── vite-env.d.ts    # TypeScript definitions
├── index.html            # HTML template
├── package.json          # Dependencies & scripts
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript config
├── tailwind.config.js    # Tailwind config
├── postcss.config.js     # PostCSS config
└── .env                  # Environment variables (create this)
```

## 🎯 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```
   VITE_ANTHROPIC_API_KEY=your-api-key-here
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to http://localhost:5173

## 🔑 API Setup

Get your Anthropic API key from: https://console.anthropic.com/

See `ANTHROPIC_SETUP.md` for detailed API setup instructions.

## 📝 Features

- 🐟 Fish image identification using AI
- 🗺️ Find nearby fishing equipment shops
- 💬 Multilingual chat assistant
- 📚 Fish encyclopedia
- 🏛️ Coast Guard information

## 🛠️ Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Anthropic Claude API** - AI for fish identification


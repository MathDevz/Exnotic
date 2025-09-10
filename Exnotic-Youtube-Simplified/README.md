# Exnotic - YouTube Video Player

A clean, ad-free YouTube video viewing application. Search and watch YouTube videos without ads, distractions, or tracking.

## What You Need

- A computer with internet access
- Basic familiarity with copying and pasting commands

No API keys, accounts, or special setup required.

## Quick Setup

### Option 1: Replit (Easiest)

1. Go to [replit.com](https://replit.com) and create a free account
2. Click "Create Repl" then "Import from GitHub"
3. Paste this repository URL: `https://github.com/your-username/exnotic`
4. Click "Import"
5. Wait for it to load, then click the green "Run" button
6. Your app will open in a new tab

### Option 2: Vercel (Fast deployment)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project"
3. Import this repository from GitHub
4. Click "Deploy"
5. Wait 2-3 minutes, then visit your new URL

### Option 3: Netlify

1. Go to [netlify.com](https://netlify.com) and sign up
2. Drag and drop the project folder onto the deploy area, OR
3. Connect your GitHub account and select this repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Click "Deploy"

### Option 4: Local Development

1. Install Node.js from [nodejs.org](https://nodejs.org) (version 18 or newer)
2. Download this project:
   ```
   git clone <repository-url>
   cd exnotic
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the server:
   ```
   npm run dev
   ```
5. Open your browser to `http://localhost:5000`

## How It Works

The app searches for videos using web scraping - no YouTube API key needed. All your favorites, watch later items, and search history are saved locally in your browser.

## Features

- Search YouTube videos
- Watch without ads
- Save favorites
- Watch later list
- Recent viewing history
- Dark/light theme
- Mobile responsive
- Bypass admin restrictions

## File Structure

```
exnotic/
├── client/          # Website frontend
├── server/          # Backend API
├── shared/          # Shared code
├── package.json     # Dependencies
└── README.md        # This file
```

## Troubleshooting

**"Module not found" errors:**
- Make sure you ran `npm install`
- Try deleting `node_modules` folder and running `npm install` again

**App won't start:**
- Check that Node.js version is 18 or higher: `node --version`
- Make sure port 5000 isn't being used by another app

**Videos won't load:**
- This is normal - some videos have regional restrictions
- Try searching for different videos
- The app tries multiple methods to find working video sources

**Slow loading:**
- First-time setup takes longer as dependencies download
- Subsequent visits will be faster

## Platform-Specific Notes

**Replit:**
- Automatically installs everything for you
- Your app URL will be `https://projectname.username.repl.co`
- Free tier may go to sleep when not used

**Vercel:**
- Fastest deployment option
- Automatic HTTPS
- Custom domain support available

**Netlify:**
- Good for beginners
- Drag-and-drop deployment available
- Free tier includes custom domains

**Railway:**
- Connect GitHub repository
- Automatic deployments on code changes
- Built-in database support if needed

## Technical Details

Built with:
- React (frontend framework)
- Node.js (backend server)
- TypeScript (programming language)
- Tailwind CSS (styling)

No database required - everything runs in memory and browser storage.

## Legal

This app doesn't store or redistribute video content. All videos remain on YouTube's servers. Not affiliated with YouTube or Google.

## License

MIT License - you can use this code for any purpose.
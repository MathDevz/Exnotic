# Vercel Deployment Guide for Exnotic

Complete step-by-step guide to deploy Exnotic video platform on Vercel. No YouTube API keys required.

## Prerequisites

- [GitHub account](https://github.com)
- [Vercel account](https://vercel.com) (sign up with GitHub)
- Repository forked or cloned to your GitHub account

## Quick Deploy (Recommended)

### Step 1: Import Repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"New Project"** from your dashboard
3. Under **"Import Git Repository"**, find your Exnotic repository
4. Click **"Import"** next to your repository

### Step 2: Configure Project Settings

Vercel will auto-detect most settings, but verify these configurations:

- **Framework Preset**: Vite
- **Build Command**: `npm run build` 
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`
- **Root Directory**: `./` (leave blank)

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. Your app will be live at `https://your-project-name.vercel.app`

## Vercel Configuration Reference

The project includes a `vercel.json` configuration file:

```json
{
  "version": 2,
  "name": "exnotic",
  "buildCommand": "npm run build",
  "installCommand": "npm install",
  "outputDirectory": "dist/public",
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods", 
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/((?!api).*)",
      "destination": "/index.html"
    }
  ]
}
```

### Configuration Explanation

- **`outputDirectory: "dist/public"`**: Vite builds the frontend to this directory
- **`headers`**: Enables CORS for API endpoints
- **`rewrites`**: Routes all non-API requests to index.html for SPA routing

Note: Serverless functions in `/api` directory are automatically detected by Vercel.

## Local Testing with Vercel CLI

### Install Vercel CLI

```bash
npm install -g vercel
```

### Setup Local Environment

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Link your project**:
   ```bash
   vercel link
   ```
   - Select your Vercel team
   - Choose "Link to existing project"
   - Select your deployed project

3. **Start development server**:
   ```bash
   vercel dev
   ```

4. **Test locally**:
   - Frontend: `http://localhost:3000`
   - API endpoints: `http://localhost:3000/api/search?q=test`

### Local API Testing

Test these endpoints locally:

```bash
# Search videos
curl "http://localhost:3000/api/search?q=music"

# Get channel info  
curl "http://localhost:3000/api/channel?id=UC_channel_id"

# Proxy video data
curl "http://localhost:3000/api/proxy/VIDEO_ID"
```

## Post-Deploy Verification Checklist

After deployment, verify these features work:

### ✅ Frontend Verification

- [ ] Homepage loads without 404 errors
- [ ] Search functionality works
- [ ] Video cards display properly
- [ ] Navigation between pages works
- [ ] Direct links (e.g., `/favorites`, `/watch-later`) don't 404 on refresh
- [ ] Favorite and watch-later buttons work inline without opening video

### ✅ API Verification

Test these API endpoints:

- [ ] `GET /api/search?q=test` returns JSON with video results
- [ ] `GET /api/channel?id=test` returns channel data
- [ ] `GET /api/proxy/VIDEO_ID` returns video metadata

### ✅ SPA Routing Verification

- [ ] Refresh any page (like `/favorites`) loads correctly
- [ ] Back/forward browser buttons work
- [ ] Direct links to app pages work when shared

## Custom Domain Setup

### Add Custom Domain

1. Go to your project dashboard on Vercel
2. Click **"Settings"** → **"Domains"**
3. Enter your custom domain
4. Follow DNS configuration instructions
5. Wait for SSL certificate provisioning (automatic)

### DNS Configuration Examples

For `yourdomain.com`:
```
A @ 76.76.19.19
```

For `app.yourdomain.com`:
```  
CNAME app cname.vercel-dns.com
```

## Troubleshooting

### 404 Error on Page Refresh

**Problem**: Refreshing `/favorites` or other routes returns 404

**Solution**: Check `vercel.json` includes the SPA rewrite rule:
```json
"rewrites": [
  {
    "source": "/(?!api/).*",
    "destination": "/index.html"
  }
]
```

### Blank Page After Deploy

**Problem**: App shows blank page or "Cannot GET /"

**Solutions**:
1. Verify **Output Directory** is set to `dist/public`
2. Check build logs for errors
3. Ensure `npm run build` works locally

### API 404 Errors

**Problem**: `/api/search` returns 404

**Solutions**:
1. Verify API files exist in `/api` directory
2. Check function files have proper export syntax:
   ```javascript
   export default async function handler(req, res) {
     // Your code here
   }
   ```
3. Review build logs for API compilation errors

### CORS Errors

**Problem**: Frontend can't reach API endpoints

**Solution**: Verify CORS headers in `vercel.json`:
```json
"headers": [
  {
    "source": "/api/(.*)",
    "headers": [
      {
        "key": "Access-Control-Allow-Origin",
        "value": "*"
      }
    ]
  }
]
```

### Build Failures

**Common Issues**:

1. **Missing dependencies**: Run `npm install` locally first
2. **TypeScript errors**: Fix all TS errors before deploying
3. **Environment variables**: Add any required variables in Vercel dashboard

**Debug Steps**:
1. Check build logs in Vercel dashboard
2. Run `npm run build` locally to reproduce errors
3. Review function logs for runtime errors

## Preview Deployments

### Automatic Preview Deployments

- Every push to non-main branches creates preview deployment
- Preview URLs: `https://your-project-git-branch-name.vercel.app`
- Perfect for testing changes before production

### Manual Preview Deploy

```bash
vercel --prod=false
```

## CI/CD Workflow

### Automatic Deployments

- **Production**: Push to `main` branch triggers production deploy
- **Preview**: Push to any other branch triggers preview deploy
- **Rollbacks**: Use Vercel dashboard to rollback to previous deployment

### Environment Branches

Set up different environments:
- `main` → Production deployment
- `staging` → Staging environment  
- `develop` → Development preview

## Performance Optimization

### Build Optimization

The project is pre-configured with:
- **Vite bundling**: Fast builds and optimized assets
- **Code splitting**: Automatic JavaScript splitting
- **Asset optimization**: Image and CSS optimization
- **Serverless functions**: Auto-scaling API endpoints

### Monitoring

Use Vercel Analytics:
1. Go to project dashboard
2. Click **"Analytics"** tab
3. Enable Web Analytics for performance insights

## Security Notes

- API endpoints use permissive CORS (`*`) for simplicity
- No authentication required - API endpoints are public
- No API keys or environment variables needed
- All data stored in memory (resets on function cold starts)

For production usage, consider:
- Restricting CORS to your domain only
- Adding rate limiting
- Implementing user authentication
- Using persistent database storage

---

**🎉 Your Exnotic video platform is now deployed on Vercel!**

Need help? Check the troubleshooting section above or contact support.
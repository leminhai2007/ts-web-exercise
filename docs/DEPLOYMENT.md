# Deployment Guide

This guide covers how to deploy your application to the internet for free.

## Recommended: Vercel (Easiest & Best for React)

### Why Vercel?

✅ **Completely Free** for personal projects

- Unlimited deployments
- 100GB bandwidth per month
- No credit card required
- Free custom domain support

✅ **Zero Maintenance**

- Auto-deploys on every git push
- Automatic HTTPS/SSL certificates
- Built-in global CDN
- No server management needed

✅ **Perfect for React + Vite**

- Optimized for your tech stack
- No configuration required
- Supports React Router out of the box

### Deployment Steps

#### Option 1: Deploy via Website (Recommended)

1. **Prepare Your Repository**

    ```bash
    # Make sure all changes are committed
    git add .
    git commit -m "Ready for deployment"
    git push origin main
    ```

2. **Deploy to Vercel**
    - Go to [vercel.com](https://vercel.com)
    - Click "Sign Up" or "Login"
    - Choose "Continue with GitHub"
    - Authorize Vercel to access your repositories
    - Click "Import Project" or "Add New..."
    - Select "Project" → "Import Git Repository"
    - Find and select `ts-web-exercise` repository
    - Click "Import"
    - **Build Settings** (Vercel auto-detects, but verify):
        - Framework Preset: `Vite`
        - Build Command: `yarn build`
        - Output Directory: `dist`
        - Install Command: `yarn install`
    - Click "Deploy"

3. **Wait for Deployment** (usually 1-2 minutes)
    - Vercel will build and deploy your site
    - You'll get a live URL like: `https://ts-web-exercise.vercel.app`

4. **Done!**
    - Your site is now live on the internet
    - Every time you push to GitHub, it automatically updates

#### Option 2: Deploy via CLI

1. **Install Vercel CLI**

    ```bash
    yarn global add vercel
    ```

2. **Login to Vercel**

    ```bash
    vercel login
    ```

3. **Deploy**

    ```bash
    vercel
    ```

    - Follow the prompts
    - Choose default options
    - Your site will be deployed

4. **Deploy to Production**
    ```bash
    vercel --prod
    ```

### Post-Deployment

#### Custom Domain (Optional)

1. Go to your project on Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

#### Environment Variables (If Needed)

1. Go to project settings on Vercel
2. Click "Environment Variables"
3. Add any needed variables

#### Automatic Deployments

- **Production**: Every push to `main` branch → production site updates
- **Preview**: Every pull request → gets preview URL for testing

---

## Alternative Options

### Option 2: Netlify

**Pros**: Similar to Vercel, great free tier, drag-and-drop option

#### Steps:

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose GitHub → Select `ts-web-exercise`
5. Build settings:
    - Build command: `yarn build`
    - Publish directory: `dist`
6. Click "Deploy site"

**Alternative - Manual Deploy**:

```bash
# Install Netlify CLI
yarn global add netlify-cli

# Build
yarn build

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

---

### Option 3: GitHub Pages

**Pros**: Free hosting on GitHub, simple for static sites
**Cons**: Requires configuration for React Router, manual deployment

#### Setup Steps:

1. **Install gh-pages**

    ```bash
    yarn add -D gh-pages
    ```

2. **Update package.json**
   Add these lines:

    ```json
    {
        "homepage": "https://leminhai2007.github.io/ts-web-exercise",
        "scripts": {
            "predeploy": "yarn build",
            "deploy": "gh-pages -d dist"
        }
    }
    ```

3. **Configure for React Router**

    Create `public/404.html`:

    ```html
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8" />
            <title>Redirecting...</title>
            <script>
                sessionStorage.redirect = location.href;
            </script>
            <meta http-equiv="refresh" content="0;URL='/'" />
        </head>
        <body></body>
    </html>
    ```

    Update `index.html` - add this script in `<head>`:

    ```html
    <script>
        (function () {
            var redirect = sessionStorage.redirect;
            delete sessionStorage.redirect;
            if (redirect && redirect != location.href) {
                history.replaceState(null, null, redirect);
            }
        })();
    </script>
    ```

4. **Deploy**

    ```bash
    yarn deploy
    ```

5. **Enable GitHub Pages**
    - Go to repository settings on GitHub
    - Navigate to "Pages" section
    - Source: Select `gh-pages` branch
    - Click "Save"

---

### Option 4: Cloudflare Pages

**Pros**: Unlimited bandwidth, very fast CDN, excellent free tier

#### Steps:

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Sign up/Login
3. Click "Create a project"
4. Connect to GitHub
5. Select `ts-web-exercise` repository
6. Build settings:
    - Build command: `yarn build`
    - Build output directory: `dist`
7. Click "Save and Deploy"

---

### Option 5: Render

**Pros**: Free static site hosting, auto-deploys from GitHub

#### Steps:

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Static Site"
4. Connect repository: `ts-web-exercise`
5. Settings:
    - Build Command: `yarn build`
    - Publish Directory: `dist`
6. Click "Create Static Site"

---

## Comparison Table

| Platform             | Free Tier        | Setup Difficulty | Auto-Deploy | React Router    | Maintenance |
| -------------------- | ---------------- | ---------------- | ----------- | --------------- | ----------- |
| **Vercel**           | ⭐⭐⭐ Excellent | ⭐⭐⭐ Easiest   | ✅ Yes      | ✅ Perfect      | Zero        |
| **Netlify**          | ⭐⭐⭐ Excellent | ⭐⭐ Easy        | ✅ Yes      | ✅ Perfect      | Zero        |
| **Cloudflare Pages** | ⭐⭐⭐ Best      | ⭐⭐ Easy        | ✅ Yes      | ✅ Perfect      | Zero        |
| **GitHub Pages**     | ⭐⭐ Good        | ⭐ Medium        | ❌ Manual   | ⚠️ Needs config | Some        |
| **Render**           | ⭐⭐ Good        | ⭐⭐ Easy        | ✅ Yes      | ✅ Perfect      | Zero        |

---

## Troubleshooting

### Build Fails

- Check that `yarn build` works locally first
- Verify all dependencies are in `package.json`
- Check build logs for specific errors

### 404 on Routes

- Make sure deployment platform is configured for SPA (Single Page App)
- Vercel/Netlify handle this automatically
- GitHub Pages needs the 404.html workaround

### Slow Build Times

- Consider reducing dependencies
- Check if any large files are being committed
- Optimize images and assets

---

## Best Practice

**Recommended Workflow**:

1. Develop locally
2. Commit changes to GitHub
3. Push to `main` branch
4. Vercel automatically deploys
5. Check live site at your Vercel URL
6. Share with others!

---

## Cost Considerations

All mentioned platforms offer free tiers sufficient for personal projects:

- **Vercel Free**: 100GB bandwidth/month, unlimited sites
- **Netlify Free**: 100GB bandwidth/month, 300 build minutes/month
- **Cloudflare Pages**: Unlimited bandwidth, 500 builds/month
- **GitHub Pages**: 100GB bandwidth/month, 1GB storage
- **Render Free**: 100GB bandwidth/month

For this project, the free tier of any platform is more than enough!

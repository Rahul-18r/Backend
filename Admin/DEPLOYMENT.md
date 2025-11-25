# Sambhram Admin Panel - Deployment Guide

## 🚀 Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard
1. Go to [https://vercel.com/new](https://vercel.com/new)
2. Import repository: `Rahul-18r/Admin`
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (keep as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - **Name**: `VITE_API_BASE_URL`
   - **Value**: `https://backend-c5lh.onrender.com`
5. Click **Deploy**

### Method 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## 🌐 Deploy to GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "predeploy": "npm run build",
# "deploy": "gh-pages -d dist"

# Add to vite.config.js:
# base: '/Admin/'

# Deploy
npm run deploy
```

## 🔧 Environment Variables

Required environment variable:
- `VITE_API_BASE_URL`: Backend API URL

Example `.env`:
```
VITE_API_BASE_URL=https://backend-c5lh.onrender.com
```

## 📝 Routes

- `/login/admin` - Admin login page
- `/login/coordinator` - Event coordinator login page
- `/login/registration` - Registration team login page
- `/dashboard` - Main dashboard (protected)
- `/verify` - QR code verification (protected)

## 🔐 Admin Credentials

**Admin Login:**
- Name: `root`
- Password: `root`

**Coordinator Login:**
- Coordinator ID: `jaya_E18` (Example: Jayasagar - VEERA SAMARA)

**Registration Team Login:**
- Username: `reg1`, `reg2`, `reg3`, `reg4`, or `reg5`

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Build Output

After running `npm run build`, the production-ready files will be in the `dist/` directory.

## ✅ Pre-Deployment Checklist

- [x] `.env` excluded from git (in `.gitignore`)
- [x] `.env.example` provided for reference
- [x] `vercel.json` configured for SPA routing
- [x] Environment variables documented
- [x] Build command verified (`npm run build`)
- [x] Production API URL configured
- [x] All routes properly configured
- [x] Role-based authentication implemented

## 🔗 Links

- **Backend Repository**: https://github.com/Rahul-18r/Backend
- **Backend URL**: https://backend-c5lh.onrender.com
- **Admin Repository**: https://github.com/Rahul-18r/Admin

## 📞 Support

For issues or questions, contact the development team.

---
© 2025 Sambhram Institute of Technology

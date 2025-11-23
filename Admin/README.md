# Sambhram Admin Panel

Admin panel for Sambhram 2025 Event Management System - Manage participants, coordinators, and event check-ins.

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

## 📦 Deployment to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Admin panel ready for deployment"
git push origin try
```

### Step 2: Deploy on Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Import repository: `Rahul-18r/sambhram`
3. Configure:
   - Framework Preset: **Vite**
   - Root Directory: `Admin`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Step 3: Add Environment Variable
```
VITE_API_BASE_URL=https://backend-c5lh.onrender.com
```

### Step 4: Deploy!

## 🔐 Login Credentials

**Admin:** name: root, contact: 1234567890, password: root  
**Coordinator:** Use coordinator ID from database  
**Registration Team:** Use username from database

## 📋 Features

✅ Admin/Coordinator/Registration Login  
✅ View & Filter Participants  
✅ QR Code Check-in  
✅ Ticket Verification  
✅ Real-time Updates  
✅ Responsive Design

## 🛠️ Tech Stack

React 19 • Vite • TailwindCSS 4 • React Router • Axios • html5-qrcode

## 📡 Backend

API: `https://backend-c5lh.onrender.com`

---

**Version**: 1.0.0

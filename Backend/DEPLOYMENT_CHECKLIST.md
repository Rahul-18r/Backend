# Backend Deployment Checklist

## ✅ Pre-Deployment

- [x] Remove unnecessary script files (checkParticipants.js, fixParticipant.js, etc.)
- [x] Update .gitignore to exclude logs, node_modules, .env
- [x] Fix Mongoose duplicate index warnings
- [x] Move mongoose from devDependencies to dependencies
- [x] Add Node.js engine requirement (>=18.0.0)
- [x] Update app.js with proper CORS and error handling
- [x] Create .env.example for reference
- [x] Add health check endpoint
- [ ] Verify all environment variables are set

## 📦 Files to Commit

**Required for Deployment:**
```
Backend/
├── app.js ✅
├── package.json ✅
├── package-lock.json ✅
├── .gitignore ✅
├── .env.example ✅
├── Admin/
│   └── adminController.js ✅
├── configs/
│   ├── db.js ✅
│   └── razorpay.js ✅
├── controllers/ ✅
├── helpers/ ✅
├── middlewares/ ✅
├── models/ ✅
├── routes/ ✅
└── utils/ ✅
```

**DO NOT Commit:**
```
❌ .env
❌ node_modules/
❌ backend.log
❌ *.log
❌ images/
❌ tickets/*.jpg
❌ Script files (check*.js, fix*.js, update*.js)
```

## 🚀 Deployment Steps

### 1. Commit and Push to GitHub

```bash
# From Backend directory
git add .
git commit -m "Backend ready for Render deployment"
git push origin try
```

### 2. Configure Render

1. Create Web Service
2. Connect GitHub repo: `Rahul-18r/sambhram`
3. Set Root Directory: `Backend`
4. Build Command: `npm install`
5. Start Command: `npm start`

### 3. Add Environment Variables in Render

```
NODE_ENV=production
PORT=5000
MONGODB_URL=mongodb+srv://...
JWT_SECRET=sambhram2025_secret_key_for_admin_portal_secure_token
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-south-1
S3_BUCKET_NAME=sambhram-tickets
```

### 4. Deploy and Verify

```bash
# Test root endpoint
curl https://sambhram-backend-e7z8.onrender.com

# Should return:
# {"success":true,"message":"Sambhram Backend API is running","version":"1.0.0","timestamp":"..."}

# Test health check
curl https://sambhram-backend-e7z8.onrender.com/health

# Test admin login
curl -X POST https://sambhram-backend-e7z8.onrender.com/api/admin/admin-login \
  -H "Content-Type: application/json" \
  -d '{"name":"root","contact":"1234567890","password":"root"}'
```

## 🔐 Security Checklist

- [ ] .env file is in .gitignore
- [ ] MongoDB IP whitelist allows Render (0.0.0.0/0)
- [ ] JWT_SECRET is strong and unique
- [ ] CORS configured for production domains
- [ ] Admin passwords are strong
- [ ] API rate limiting enabled
- [ ] HTTPS enabled (automatic on Render)

## 🎯 Post-Deployment

### Update Admin Panel

Update `Admin/.env`:
```
VITE_API_BASE_URL=https://sambhram-backend-e7z8.onrender.com
```

### Test All Endpoints

- [ ] Admin login works
- [ ] Coordinator login works
- [ ] Registration login works
- [ ] Get participants works
- [ ] Check-in works
- [ ] Ticket verification works

### Monitor Logs

Check Render dashboard logs for:
- Successful MongoDB connection
- No error messages
- API requests logging correctly

## 📊 MongoDB Atlas Setup

1. **Network Access**
   - Add IP: `0.0.0.0/0` (allow from anywhere)
   - Or add Render IPs specifically

2. **Database User**
   - Username: Set in MONGODB_URL
   - Password: Set in MONGODB_URL
   - Role: Read and write to any database

3. **Connection String**
   ```
   mongodb+srv://<username>:<password>@cluster.mongodb.net/sambram?retryWrites=true&w=majority
   ```

## ⚡ Performance Tips

1. **Free Tier Sleeping**
   - App sleeps after 15 min inactivity
   - First request takes ~30 seconds to wake
   - Use cron job to ping every 10 min (optional)

2. **Database Indexes**
   - Already configured in models
   - ticketUid, phone, coordinatorId, username

3. **Caching**
   - Events cache preloaded on startup
   - Node-cache configured for participants

## 🐛 Troubleshooting

### Build Fails
- Check Node version (>=18.0.0)
- Verify package.json is valid
- Check build logs for errors

### Runtime Errors
- Check environment variables spelling
- Verify MongoDB connection string
- Check runtime logs in Render

### 404 on Routes
- Ensure all route files committed
- Check app.js route registration
- Verify Root Directory set to `Backend`

### MongoDB Connection Issues
- Check IP whitelist in Atlas
- Verify connection string format
- Ensure database user has permissions

---

**Ready to Deploy?** ✅
1. Complete all checkboxes above
2. Test locally first
3. Commit and push to GitHub
4. Configure Render
5. Deploy and verify!

**Support**: Check RENDER_DEPLOYMENT.md for detailed instructions

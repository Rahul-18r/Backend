# Sambhram Backend - Render Deployment Guide

## 🚀 Quick Deploy to Render

### Prerequisites
- GitHub account
- Render account (free tier works)
- MongoDB Atlas database

### Step 1: Push Code to GitHub

```bash
cd Backend
git add .
git commit -m "Prepare backend for Render deployment"
git push origin try
```

### Step 2: Create Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Rahul-18r/sambhram`
4. Configure the service:

   - **Name**: `sambhram-backend`
   - **Region**: Choose nearest (e.g., Singapore)
   - **Branch**: `try`
   - **Root Directory**: `Backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### Step 3: Add Environment Variables

In Render dashboard, go to **Environment** tab and add:

```env
NODE_ENV=production
PORT=5000
MONGODB_URL=<your-mongodb-atlas-connection-string>
JWT_SECRET=sambhram2025_secret_key_for_admin_portal_secure_token
RAZORPAY_KEY_ID=<your-razorpay-key>
RAZORPAY_KEY_SECRET=<your-razorpay-secret>
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=<your-aws-region>
S3_BUCKET_NAME=<your-s3-bucket>
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment to complete (~5-10 minutes)
3. Your backend will be live at: `https://sambhram-backend-e7z8.onrender.com`

### Step 5: Verify Deployment

Test the endpoints:

```bash
# Test root endpoint
curl https://sambhram-backend-e7z8.onrender.com

# Test admin login
curl -X POST https://sambhram-backend-e7z8.onrender.com/api/admin/admin-login \
  -H "Content-Type: application/json" \
  -d '{"name":"root","contact":"1234567890","password":"root"}'
```

## 🔧 Important Notes

### Free Tier Limitations
- App sleeps after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month free

### Keep Alive (Optional)
To prevent sleeping, use a cron job to ping your API every 10 minutes:
```bash
*/10 * * * * curl https://sambhram-backend-e7z8.onrender.com
```

### Logs
View logs in Render dashboard: **Logs** tab

### Auto Deploy
Render automatically deploys when you push to the `try` branch.

## 📋 API Endpoints

### Admin Routes
- `POST /api/admin/admin-login` - Admin login
- `POST /api/admin/coordinator-login` - Coordinator login
- `POST /api/admin/registration-login` - Registration team login
- `GET /api/admin/participants` - Get all participants (protected)
- `GET /api/admin/participant/:festId` - Get participant by ID (protected)
- `POST /api/admin/checkin` - Check-in participant (protected)
- `POST /api/admin/Create-participants` - Create spot participant (admin only)

### Public Routes
- `GET /api/v1/auth/events` - Get all events
- `POST /api/v1/auth/payment` - Register participant
- `GET /api/v1/auth/verify/ticket` - Verify ticket by QR code

## 🛠️ Troubleshooting

### Issue: 404 on admin routes
- Ensure all files are committed and pushed
- Check Render logs for errors
- Verify build completed successfully

### Issue: MongoDB connection failed
- Check MongoDB Atlas network access (allow 0.0.0.0/0)
- Verify connection string format
- Ensure MongoDB user has read/write permissions

### Issue: Environment variables not working
- Double-check spelling in Render dashboard
- Restart service after adding variables
- Check for extra spaces in values

## 📞 Support

For issues, check:
1. Render build logs
2. Runtime logs
3. MongoDB Atlas logs
4. Network access settings

## 🎯 Production Checklist

- [x] Remove unnecessary script files
- [x] Update .gitignore
- [x] Fix mongoose duplicate indexes
- [x] Move mongoose to dependencies
- [x] Add Node.js engine version
- [x] Configure CORS for all origins
- [x] Set up JWT authentication
- [x] Add logging with Winston
- [x] Rate limiting configured
- [ ] SSL/HTTPS enabled (auto by Render)
- [ ] Custom domain configured (optional)
- [ ] Monitoring setup (optional)

## 🔐 Security Notes

- Never commit `.env` file
- Rotate JWT_SECRET regularly
- Use strong passwords for admin accounts
- Enable MongoDB IP whitelist in production
- Review CORS origins for production

---

**Last Updated**: November 23, 2025
**Version**: 1.0.0

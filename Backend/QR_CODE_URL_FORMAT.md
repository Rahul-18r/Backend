# 🎫 QR Code URL Format - Quick Reference

## ✅ What Changed

### Before:
```json
QR Code contained JSON:
{
  "id": "69120d1d8aa39229dff7b99f",
  "name": "Rahul Mogaveer",
  "events": ["DRISHYA MAHIMA", "RANG MUKHAM"]
}
```

### After:
```
QR Code contains URL:
http://localhost:3069/verify?ticketUid=FEST-20251110-A3B2C1D4
```

---

## 🔧 How It Works

### 1. Ticket Generation
When payment is successful:
- System generates unique `ticketUid`: `FEST-20251110-A3B2C1D4`
- QR code is created with URL: `http://localhost:3069/verify?ticketUid=FEST-20251110-A3B2C1D4`
- Ticket image with QR code uploaded to S3

### 2. Scanning QR Code
When user scans the QR code:
- Opens browser with URL: `http://localhost:3069/verify?ticketUid=FEST-20251110-A3B2C1D4`
- Verification page automatically calls backend API
- Shows ticket details if valid

---

## 📁 Files Created/Modified

### ✅ Backend Files Modified:
1. **`helpers/qrCodeGenerator.js`**
   - Changed from JSON to URL format
   - URL: `{FRONTEND_URL}/verify?ticketUid={ticketUid}`

### ✅ Frontend Files Created:
1. **`Frontend/public/verify.html`**
   - Simple demo verification page
   - Automatically verifies ticket on load
   - Shows participant and event details

---

## 🚀 Testing the QR Code

### Setup:

1. **Set environment variable in Backend:**
   ```env
   FRONTEND_URL=http://localhost:3069
   ```

2. **Serve the verify.html page:**
   
   **Option A: Using Frontend Dev Server**
   ```bash
   cd Frontend
   npm run dev
   ```
   Access: `http://localhost:3069/verify.html?ticketUid=YOUR_TICKET_UID`

   **Option B: Direct File (No Server Needed)**
   - Just open `Frontend/public/verify.html` in browser
   - Manually add: `?ticketUid=FEST-20251110-A3B2C1D4` to URL

3. **Generate a test ticket:**
   - Complete a payment transaction
   - System generates ticket with QR code
   - QR code will contain URL like: `http://localhost:3069/verify?ticketUid=FEST-20251110-A3B2C1D4`

4. **Scan QR code:**
   - Use mobile camera or QR scanner app
   - Browser opens with verification page
   - Page shows ticket details

---

## 🧪 Manual Testing

### Test URL Format:
```
http://localhost:3069/verify.html?ticketUid=FEST-20251110-A3B2C1D4
```

### Get Real Ticket UID:
1. Check MongoDB database:
   ```javascript
   db.participants.findOne({}, { ticketUid: 1, name: 1 })
   ```
   
2. Or check backend logs when ticket is generated:
   ```
   Generated QR Code URL: http://localhost:3069/verify?ticketUid=FEST-20251110-A3B2C1D4
   ```

### Test with Real Data:
```bash
# Get participant with ticketUid
curl http://localhost:5000/api/verify/ticket?ticketUid=FEST-20251110-A3B2C1D4
```

---

## 🌐 Production Setup

### When deploying to production:

1. **Update Backend `.env`:**
   ```env
   FRONTEND_URL=https://yoursite.com
   ```

2. **QR Code will contain:**
   ```
   https://yoursite.com/verify?ticketUid=FEST-20251110-A3B2C1D4
   ```

3. **Update Frontend `verify.html`:**
   ```javascript
   const BACKEND_URL = 'https://api.yoursite.com'; // Line 138
   ```

4. **Deploy verify.html:**
   - Route: `/verify` should serve `verify.html`
   - OR use React Router in your main app

---

## 📱 Example QR Code URLs

```
Development:
http://localhost:3069/verify?ticketUid=FEST-20251110-A3B2C1D4

Production:
https://yourfest.com/verify?ticketUid=FEST-20251110-A3B2C1D4
https://sambhram.edu/verify?ticketUid=FEST-20251110-B4C5D6E7
```

---

## 🎯 Benefits of URL-Based QR

✅ **No Custom App Needed** - Works with any QR scanner
✅ **Better UX** - Direct browser access
✅ **Mobile Friendly** - Responsive design
✅ **Real-time Verification** - Instant API call
✅ **Shows Event Details** - Complete information displayed
✅ **Offline Fallback** - Can cache data if needed
✅ **SEO Friendly** - Can be indexed
✅ **Shareable** - Can send link via WhatsApp/SMS

---

## 🔍 API Endpoint

### Verify Ticket API:
```http
GET /api/verify/ticket?ticketUid={uid}
```

### Response:
```json
{
  "success": true,
  "message": "Ticket verified successfully",
  "data": {
    "ticketUid": "FEST-20251110-A3B2C1D4",
    "participantInfo": {
      "name": "Rahul Mogaveer",
      "usn": "1MS21CS001",
      "phone": "9876543210",
      "college": "XYZ College"
    },
    "registrations": [
      {
        "event_id": "...",
        "eventDetails": {
          "eventName": "DRISHYA MAHIMA",
          "eventType": "Cultural",
          "date": "2025-11-15",
          "time": "10:00 AM",
          "venue": "Main Auditorium"
        },
        "amount": 100,
        "payment_status": "paid"
      }
    ],
    "totalEvents": 2,
    "verifiedAt": "2025-11-10T14:30:00Z"
  }
}
```

---

## 🛠️ Troubleshooting

### QR Code Not Working?

1. **Check Environment Variable:**
   ```bash
   echo $FRONTEND_URL  # Should show http://localhost:3069
   ```

2. **Check Generated URL:**
   - Look for log: `Generated QR Code URL: ...`
   - Verify it matches your frontend

3. **Test URL Manually:**
   - Copy URL from logs
   - Open in browser
   - Should see verification page

4. **CORS Issues:**
   - Make sure backend allows frontend origin
   - Check `app.js` for CORS settings

---

## 📞 Need Help?

Common Issues:
- ❌ "Ticket not found" → Check if ticketUid exists in DB
- ❌ "CORS error" → Update backend CORS settings
- ❌ "Network error" → Check if backend is running
- ❌ "Invalid URL" → Check environment variable

---

**Last Updated:** November 10, 2025
**Format:** URL-based QR Code
**Status:** ✅ Ready for Testing

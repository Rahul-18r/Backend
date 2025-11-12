# 🎟️ National Tech Fest - Ticket Generation System Documentation

## Overview
This document describes the complete ticket generation and verification system for your national-level tech fest.

---

## 🔄 Complete Workflow

### 1. **Participant Registration**
```
User selects events → Creates order → Proceeds to payment
```

### 2. **Payment Processing**
- **Payment Gateway**: Cashfree/Razorpay
- **Payment Methods**: UPI, Cards, Net Banking
- **Order Format**: `FEST-{timestamp}-{random}`

### 3. **Ticket Generation (Upon Successful Payment)**

#### Step 1: Webhook Triggered
When payment is successful, the payment gateway sends a webhook to:
```
POST /api/payment/webhooks
```

#### Step 2: Participant Creation/Update
- Creates or updates participant in database
- Generates unique `ticketUid`: `FEST-YYYYMMDD-XXXXXXXX`
- Associates events with participant

#### Step 3: Ticket Image Generation
The system generates a beautiful ticket image containing:
- ✅ Participant Name (in gold, uppercase)
- ✅ Unique Ticket UID (e.g., FEST-20251110-A3B2C1D4)
- ✅ Phone Number
- ✅ Price Paid (₹)
- ✅ Number of Events Registered
- ✅ List of Event Names (with checkmarks)
- ✅ QR Code with verification URL
- ✅ Festival Branding

#### Step 4: QR Code Generation
The QR code contains a URL:
```
https://your-frontend-url.com/verify-ticket?ticketUid=FEST-20251110-A3B2C1D4
```

When scanned, it redirects to your verification page.

#### Step 5: Upload to S3
- Ticket image uploaded to AWS S3
- URL stored in participant's registration record
- Format: `tickets/{order_id}.jpg`

---

## 🔍 Ticket Verification System

### Frontend Verification Flow
1. **User scans QR code** → Opens URL with ticketUid
2. **Frontend page** `/verify-ticket` receives ticketUid
3. **Frontend calls API**: 
   ```javascript
   GET /api/verify/ticket?ticketUid=FEST-20251110-A3B2C1D4
   // OR
   POST /api/verify/ticket
   Body: { ticketUid: "FEST-20251110-A3B2C1D4" }
   ```

### Backend Verification Endpoint

#### Request
```http
GET /api/verify/ticket?ticketUid=FEST-20251110-A3B2C1D4
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Ticket verified successfully",
  "data": {
    "ticketUid": "FEST-20251110-A3B2C1D4",
    "participantInfo": {
      "name": "John Doe",
      "usn": "1MS21CS001",
      "phone": "9876543210",
      "college": "XYZ College"
    },
    "registrations": [
      {
        "event_id": "507f1f77bcf86cd799439011",
        "eventDetails": {
          "eventName": "Hackathon",
          "eventType": "Technical",
          "date": "2025-11-15T00:00:00.000Z",
          "time": "10:00 AM",
          "venue": "Main Auditorium"
        },
        "ticket_url": "https://s3.amazonaws.com/tickets/...",
        "amount": 100,
        "order_id": "FEST-1699612800-123",
        "payment_status": "paid",
        "registration_date": "2025-11-10T12:30:00.000Z"
      }
    ],
    "totalEvents": 3,
    "verifiedAt": "2025-11-10T14:25:00.000Z"
  }
}
```

#### Error Response (404)
```json
{
  "success": false,
  "message": "Ticket not found or invalid"
}
```

---

## 📊 Database Schema

### Participant Model
```javascript
{
  _id: ObjectId,
  name: String,
  usn: String,
  phone: String (unique),
  college: String,
  ticketUid: String (unique) // e.g., "FEST-20251110-A3B2C1D4"
  registrations: [
    {
      event_id: ObjectId,
      ticket_url: String,
      amount: Number,
      order_id: String,
      payment_status: String, // "paid" | "failed"
      razorpay_payment_id: String,
      registration_date: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 Ticket Design Features

### Visual Elements
- **Size**: 1200x4000px (optimized for mobile display)
- **Background**: Custom event-based images (1.jpg, 2.jpg, 3.jpg, 4.jpg)
- **Color Scheme**: Gold (#FFD700) and Black
- **Font**: Poppins (Google Fonts)

### Layout Components
1. **Golden Border** with corner decorations
2. **Gradient Overlay** for text readability
3. **Participant Information Section**
   - Name in large gold letters
   - Ticket UID
   - Contact details
   - Event list with checkmarks
4. **QR Code** (centered, white background)
5. **Festival Branding** (bottom)

---

## 🔐 Security Features

### 1. Payment Verification
- Signature validation on webhooks
- HMAC-SHA256 encryption
- Prevents replay attacks

### 2. Duplicate Prevention
- Checks for existing orders before processing
- Prevents double-charging
- Maximum 4 events per participant

### 3. Transaction Safety
- MongoDB sessions for atomic operations
- Rollback on errors
- Session management

---

## 🚀 API Endpoints Summary

### Event Management
```http
GET /api/events
```
Returns list of all available events.

### Payment
```http
POST /api/payment
Body: { name, usn, phone, college, registrations[], email }
```
Creates payment order.

### Webhook (Internal)
```http
POST /api/payment/webhooks
```
Receives payment confirmation from gateway.

### Ticket Verification
```http
GET /api/verify/ticket?ticketUid={uid}
POST /api/verify/ticket
Body: { ticketUid: string }

# Alternative shorter route
GET /api/verify?ticketUid={uid}
```

---

## 📱 Frontend Implementation Example

### Verify Ticket Page (`/verify-ticket`)

```jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

function VerifyTicket() {
  const [searchParams] = useSearchParams();
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ticketUid = searchParams.get('ticketUid');
    
    if (!ticketUid) {
      setError('Invalid ticket URL');
      setLoading(false);
      return;
    }

    verifyTicket(ticketUid);
  }, [searchParams]);

  const verifyTicket = async (ticketUid) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/verify/ticket?ticketUid=${ticketUid}`
      );
      
      if (response.data.success) {
        setTicketData(response.data.data);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify ticket');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loader">Verifying ticket...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>❌ Verification Failed</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="ticket-verification">
      <h1>✅ Ticket Verified!</h1>
      
      <div className="participant-info">
        <h2>{ticketData.participantInfo.name}</h2>
        <p>Ticket ID: {ticketData.ticketUid}</p>
        <p>Phone: {ticketData.participantInfo.phone}</p>
        <p>College: {ticketData.participantInfo.college}</p>
      </div>

      <div className="events-section">
        <h3>Registered Events ({ticketData.totalEvents})</h3>
        {ticketData.registrations.map((reg, index) => (
          <div key={index} className="event-card">
            <h4>{reg.eventDetails.eventName}</h4>
            <p>Type: {reg.eventDetails.eventType}</p>
            <p>Venue: {reg.eventDetails.venue}</p>
            <p>Date: {new Date(reg.eventDetails.date).toLocaleDateString()}</p>
            <p>Time: {reg.eventDetails.time}</p>
            <p>Amount: ₹{reg.amount}</p>
          </div>
        ))}
      </div>

      <div className="verification-footer">
        <p>Verified at: {new Date(ticketData.verifiedAt).toLocaleString()}</p>
      </div>
    </div>
  );
}

export default VerifyTicket;
```

---

## 🔧 Environment Variables Required

```env
# Frontend
VITE_FRONTEND_URL=https://your-frontend.com
VITE_BACKEND_URL=https://your-backend.com

# Backend
FRONTEND_URL=https://your-frontend.com
BACKEND_URL=https://your-backend.com
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
CASHFREE_ENV=production
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

---

## 📦 Dependencies

### Backend
```json
{
  "qrcode": "^1.5.3",
  "puppeteer": "^21.0.0",
  "sharp": "^0.32.0",
  "cashfree-pg": "^1.0.0",
  "mongoose": "^7.0.0",
  "aws-sdk": "^2.1400.0"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.14.0",
  "axios": "^1.4.0"
}
```

---

## 🎯 Key Features

### ✅ Implemented
1. **Unique Ticket UID Generation** - Format: FEST-YYYYMMDD-XXXXXXXX
2. **QR Code with Verification URL** - Scans to verification page
3. **Beautiful Ticket Design** - Professional, printable format
4. **Event List Display** - Shows all registered events on ticket
5. **Secure Payment Processing** - Webhook validation
6. **Duplicate Prevention** - No double-charging
7. **S3 Storage** - Scalable ticket storage
8. **REST API Verification** - GET/POST support
9. **Event Details Population** - Full event information in verification

### 🎨 Customization Points
- Update "COLLEGE FEST 2025" in `imageUpdation.js`
- Update "Your College Name" in `imageUpdation.js`
- Customize ticket colors in HTML template
- Adjust ticket size/layout as needed
- Modify QR code URL format

---

## 🧪 Testing

### Test Ticket Verification
```bash
# Using curl
curl -X GET "http://localhost:5000/api/verify/ticket?ticketUid=FEST-20251110-A3B2C1D4"

# Using Postman
GET http://localhost:5000/api/verify/ticket?ticketUid=FEST-20251110-A3B2C1D4
```

### Generate Test QR Code
You can manually generate a QR code for testing:
```javascript
import QRCode from 'qrcode';

const url = 'http://localhost:5173/verify-ticket?ticketUid=FEST-20251110-A3B2C1D4';
QRCode.toFile('test-qr.png', url);
```

---

## 📞 Support & Maintenance

### Common Issues

#### 1. QR Code Not Scanning
- Ensure error correction level is 'H'
- Check QR code size (minimum 600x600px)
- Verify URL is properly formatted

#### 2. Ticket Not Found
- Check if ticketUid exists in database
- Verify payment was successful
- Check webhook logs

#### 3. Image Generation Fails
- Ensure Puppeteer is properly installed
- Check base images exist in `/images/` folder
- Verify fonts are loading correctly

---

## 🚀 Deployment Checklist

- [ ] Set all environment variables
- [ ] Configure AWS S3 bucket
- [ ] Set up payment gateway webhooks
- [ ] Upload base ticket images (1.jpg, 2.jpg, 3.jpg, 4.jpg)
- [ ] Test payment flow end-to-end
- [ ] Test QR code scanning
- [ ] Verify ticket generation
- [ ] Test verification API
- [ ] Set up monitoring/logging
- [ ] Configure rate limiting

---

## 📈 Future Enhancements

1. **Email Integration** - Send ticket via email
2. **SMS Notifications** - Send ticket link via SMS
3. **Ticket Download** - Allow direct PDF download
4. **Offline Verification** - Store verification data locally
5. **Analytics Dashboard** - Track scans and attendance
6. **Batch Ticket Generation** - Generate multiple tickets
7. **Custom Ticket Templates** - Different designs per event
8. **Check-in System** - Mark attendance when scanned

---

## 📝 License & Credits

Built for National Tech Fest Management
- QR Code: node-qrcode library
- Ticket Design: Puppeteer + HTML/CSS
- Image Processing: Sharp
- Payment: Cashfree/Razorpay

---

**Last Updated**: November 10, 2025
**Version**: 2.0

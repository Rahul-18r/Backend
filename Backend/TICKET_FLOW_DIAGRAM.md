# 🎫 Ticket Generation & Verification Flow

## Complete System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER REGISTRATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣  User Opens Website
    │
    ├─→ Browses Events (GET /api/events)
    │
    └─→ Selects Events (Max 4)
         │
         ├─→ Fills Registration Form
         │    ├─ Name
         │    ├─ USN
         │    ├─ Phone
         │    ├─ College
         │    └─ Email
         │
         └─→ Clicks "Pay Now"
              │
              └─→ POST /api/payment
                   │
                   ├─→ Creates Order in DB
                   │    └─ Order ID: FEST-{timestamp}-{random}
                   │
                   └─→ Redirects to Payment Gateway
                        (Cashfree/Razorpay)


┌─────────────────────────────────────────────────────────────────────────┐
│                         PAYMENT PROCESSING                              │
└─────────────────────────────────────────────────────────────────────────┘

2️⃣  Payment Gateway (Cashfree/Razorpay)
    │
    ├─→ User Enters Payment Details
    │    └─ UPI / Card / Net Banking
    │
    └─→ Payment Processed
         │
         ├─→ ✅ SUCCESS
         │    │
         │    └─→ Webhook Triggered
         │         POST /api/payment/webhooks
         │         │
         │         └─→ Signature Validation
         │              │
         │              ├─→ ❌ Invalid → Return 400
         │              │
         │              └─→ ✅ Valid → Continue
         │
         └─→ ❌ FAILURE
              └─→ User Redirected to Failure Page


┌─────────────────────────────────────────────────────────────────────────┐
│                    TICKET GENERATION (BACKEND)                          │
└─────────────────────────────────────────────────────────────────────────┘

3️⃣  Webhook Processing (webhookController.js)
    │
    ├─→ Extract Payment Data
    │    ├─ order_id
    │    ├─ payment_id
    │    ├─ amount
    │    └─ user details
    │
    ├─→ Start MongoDB Transaction
    │
    ├─→ Find/Create Participant
    │    │
    │    ├─→ New Participant?
    │    │    └─→ Generate ticketUid
    │    │         Format: FEST-YYYYMMDD-XXXXXXXX
    │    │         Example: FEST-20251110-A3B2C1D4
    │    │
    │    └─→ Existing Participant?
    │         └─→ Use existing ticketUid
    │
    ├─→ Check Duplicate Registration
    │    └─→ Skip if already registered
    │
    ├─→ Check Event Limit (Max 4)
    │
    ├─→ Generate Ticket (ticketGeneration.js)
    │    │
    │    ├─→ Get Event Names
    │    │
    │    ├─→ Generate QR Code (qrCodeGenerator.js)
    │    │    │
    │    │    └─→ URL: {FRONTEND_URL}/verify-ticket?ticketUid={ticketUid}
    │    │         Example: https://yoursite.com/verify-ticket?ticketUid=FEST-20251110-A3B2C1D4
    │    │
    │    ├─→ Create Ticket Image (imageUpdation.js)
    │    │    │
    │    │    ├─→ Load Base Image (1.jpg/2.jpg/3.jpg/4.jpg)
    │    │    │
    │    │    ├─→ Create HTML Template
    │    │    │    ├─ Participant Name
    │    │    │    ├─ Ticket UID
    │    │    │    ├─ Phone Number
    │    │    │    ├─ Price
    │    │    │    ├─ Event Count
    │    │    │    ├─ Event Names List
    │    │    │    └─ QR Code
    │    │    │
    │    │    ├─→ Render with Puppeteer
    │    │    │    └─ Size: 1200x4000px
    │    │    │
    │    │    └─→ Return JPEG Buffer
    │    │
    │    └─→ Upload to S3 (uploadImagetoS3.js)
    │         │
    │         ├─→ Key: tickets/{order_id}.jpg
    │         │
    │         └─→ Return S3 URL
    │              Example: https://s3.amazonaws.com/bucket/tickets/FEST-1699612800-123.jpg
    │
    ├─→ Save Registration to DB
    │    └─→ {
    │         event_id,
    │         ticket_url: S3_URL,
    │         amount,
    │         order_id,
    │         payment_status: "paid",
    │         razorpay_payment_id,
    │         registration_date
    │        }
    │
    ├─→ Commit Transaction
    │
    └─→ Return Success (200)


┌─────────────────────────────────────────────────────────────────────────┐
│                       USER RECEIVES TICKET                              │
└─────────────────────────────────────────────────────────────────────────┘

4️⃣  Success Page
    │
    ├─→ Show Order ID
    │
    ├─→ Display Ticket Image (from S3)
    │
    ├─→ Download Button
    │
    └─→ QR Code Visible
         └─→ Can be scanned for verification


┌─────────────────────────────────────────────────────────────────────────┐
│                    TICKET VERIFICATION FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

5️⃣  At Event Entry (Security Check)
    │
    ├─→ Guard Scans QR Code
    │    │
    │    └─→ QR Contains URL:
    │         https://yoursite.com/verify-ticket?ticketUid=FEST-20251110-A3B2C1D4
    │
    ├─→ Browser Opens Verification Page
    │    │
    │    └─→ Component: /verify-ticket
    │
    ├─→ Frontend Extracts ticketUid from URL
    │    └─→ useSearchParams() or URLSearchParams
    │
    ├─→ Frontend Calls Backend API
    │    │
    │    └─→ GET /api/verify/ticket?ticketUid=FEST-20251110-A3B2C1D4
    │
    ├─→ Backend Verification (verifyQrcode.js)
    │    │
    │    ├─→ Search by ticketUid
    │    │    ├─ Try custom ticketUid field
    │    │    └─ Fallback to MongoDB _id
    │    │
    │    ├─→ Participant Found?
    │    │    │
    │    │    ├─→ ❌ NO → Return 404
    │    │    │    └─ "Ticket not found or invalid"
    │    │    │
    │    │    └─→ ✅ YES → Continue
    │    │
    │    ├─→ Get Paid Registrations
    │    │    └─→ Filter: payment_status === "paid"
    │    │
    │    ├─→ Fetch Event Details
    │    │    └─→ Populate from Event collection
    │    │
    │    └─→ Return Response
    │         └─→ {
    │              success: true,
    │              data: {
    │                ticketUid,
    │                participantInfo: { name, usn, phone, college },
    │                registrations: [
    │                  {
    │                    event_id,
    │                    eventDetails: {
    │                      eventName, eventType, date, time, venue
    │                    },
    │                    ticket_url,
    │                    amount,
    │                    order_id,
    │                    payment_status,
    │                    registration_date
    │                  }
    │                ],
    │                totalEvents,
    │                verifiedAt
    │              }
    │            }
    │
    └─→ Frontend Displays Verification Result
         │
         ├─→ ✅ Valid Ticket
         │    ├─ Show Green Checkmark
         │    ├─ Display Participant Name
         │    ├─ List All Events
         │    └─ Show Event Details
         │
         └─→ ❌ Invalid Ticket
              ├─ Show Red Cross
              └─ Display Error Message


┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE STRUCTURE                              │
└─────────────────────────────────────────────────────────────────────────┘

📊 Participant Collection
{
  _id: "ObjectId(...)",
  name: "John Doe",
  usn: "1MS21CS001",
  phone: "9876543210",
  college: "XYZ College",
  ticketUid: "FEST-20251110-A3B2C1D4",  ← UNIQUE TICKET ID
  registrations: [
    {
      event_id: "ObjectId(...)",
      ticket_url: "https://s3.../tickets/FEST-1699612800-123.jpg",
      amount: 100,
      order_id: "FEST-1699612800-123",
      payment_status: "paid",
      razorpay_payment_id: "pay_abc123",
      registration_date: "2025-11-10T12:30:00Z"
    }
  ],
  createdAt: "2025-11-10T12:30:00Z",
  updatedAt: "2025-11-10T12:30:00Z"
}


┌─────────────────────────────────────────────────────────────────────────┐
│                         QR CODE CONTENT                                 │
└─────────────────────────────────────────────────────────────────────────┘

📱 QR Code Contains:
   URL: https://yoursite.com/verify-ticket?ticketUid=FEST-20251110-A3B2C1D4

   NOT JSON data (changed from old implementation)

   Advantages:
   ✅ Direct verification via web page
   ✅ Better user experience
   ✅ Mobile-friendly
   ✅ Can show event details instantly
   ✅ No need for custom QR scanner app


┌─────────────────────────────────────────────────────────────────────────┐
│                         API ENDPOINTS                                   │
└─────────────────────────────────────────────────────────────────────────┘

🔌 Available Endpoints:

1. GET /api/events
   - Returns all available events

2. POST /api/payment
   - Creates payment order
   - Body: { name, usn, phone, college, email, registrations[] }

3. POST /api/payment/webhooks
   - Receives payment gateway webhook
   - Internal use only

4. GET /api/verify/ticket?ticketUid={uid}
   - Verifies ticket
   - Returns participant and event details

5. POST /api/verify/ticket
   - Alternative verification method
   - Body: { ticketUid: string }

6. GET /api/verify?ticketUid={uid}
   - Shorter verification URL
   - Same as #4


┌─────────────────────────────────────────────────────────────────────────┐
│                      SECURITY MEASURES                                  │
└─────────────────────────────────────────────────────────────────────────┘

🔒 Security Features:

1. Webhook Signature Validation
   └─→ HMAC-SHA256 verification

2. Duplicate Prevention
   └─→ Check order_id + event_id combination

3. Transaction Safety
   └─→ MongoDB sessions with rollback

4. Unique Ticket UIDs
   └─→ Crypto-random generation

5. Event Limit Enforcement
   └─→ Maximum 4 events per participant

6. Payment Status Verification
   └─→ Only "paid" registrations are valid


┌─────────────────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                                     │
└─────────────────────────────────────────────────────────────────────────┘

❌ Common Error Scenarios:

1. Ticket Not Found (404)
   └─→ ticketUid doesn't exist in database

2. Invalid Signature (400)
   └─→ Webhook signature validation failed

3. Duplicate Registration (200)
   └─→ Already processed (prevent double-charge)

4. Event Limit Reached (400)
   └─→ User already registered for 4 events

5. Payment Failed (stored but not shown)
   └─→ payment_status = "failed"

6. Server Error (500)
   └─→ Database or S3 issues


┌─────────────────────────────────────────────────────────────────────────┐
│                         SUCCESS METRICS                                 │
└─────────────────────────────────────────────────────────────────────────┘

📈 System Capabilities:

✅ Unique Ticket Generation
✅ QR Code with Verification URL
✅ Beautiful Printable Tickets
✅ Event List on Ticket
✅ Secure Payment Processing
✅ Duplicate Prevention
✅ Scalable S3 Storage
✅ Fast Verification (< 1 second)
✅ Mobile-Friendly Verification
✅ Real-Time Event Details
✅ Transaction Safety
✅ Maximum 4 Events Per User

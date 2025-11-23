# Sambhram 2025 - Ticket Generator

This directory contains the ticket generation system for Sambhram 2025.

## Files

- `index.html` - Main ticket HTML template with styling
- `ticket.js` - JavaScript to fetch participant data and populate the ticket
- `sambhram-logo.png` - Sambhram logo (add this file)

## Usage

### Single Ticket View

To generate a ticket for a specific participant, open:

```
http://localhost:3000/ticket/index.html?id=TICKET_ID
```

Replace `TICKET_ID` with the participant's `ticketUid` or `order_id`.

Examples:
- `http://localhost:3000/ticket/index.html?id=FEST-1763792325943-5BF091`
- `http://localhost:3000/ticket/index.html?id=MANUAL-1763746293682-DB3385`

### Features

1. **Auto-populate from Backend**: Fetches participant data from the backend API
2. **QR Code Generation**: Generates QR code from ticket ID
3. **Team Information**: Shows team names and roles for team events
4. **Download as PNG**: Click the download button to save the ticket as an image
5. **Responsive Design**: Works on desktop, tablet, and mobile devices

### Data Displayed

- Participant name
- Ticket ID
- Amount paid
- Events registered (with date, time, venue)
- Team information (for team events)
- QR code for check-in

## Setup

1. Make sure your backend server is running on `http://localhost:5000`
2. Add the `sambhram-logo.png` file to the `Backend` directory
3. The backend must have the `/api/admin/participant/:festId` endpoint available

## API Endpoint Required

The ticket system fetches data from:

```
GET http://localhost:5000/api/admin/participant/:festId
```

This endpoint should return participant data with registrations array.

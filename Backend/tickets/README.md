# Tickets Directory

This directory stores generated ticket images locally.

## Structure
```
tickets/
├── FEST-{timestamp}-{random}.jpg
└── ...
```

## Notes
- Ticket images are automatically generated when payment is successful
- Each ticket is named using the order_id: `{order_id}.jpg`
- Tickets are served via: `GET /api/payment/ticket/image/{order_id}`
- If a ticket doesn't exist locally, it will be generated on-the-fly

## Storage
- **Old System:** Used AWS S3 (removed)
- **Current System:** Local file storage in this directory

## Cleanup
You can safely delete old tickets if needed. They will be regenerated when requested.

## Access
Tickets are accessible via the API endpoint:
```
GET http://localhost:5000/api/payment/ticket/image/{order_id}
```

This endpoint will:
1. Check if ticket exists locally
2. Serve it if found
3. Generate it on-the-fly if not found
4. Save it for future requests

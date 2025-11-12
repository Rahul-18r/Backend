import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import { generateQRCode } from './qrCodeGenerator.js';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageCache = new Map();

const getBaseImage = async (eventCount) => {
  try {
    const cacheKey = `event_${eventCount}`;

    if (!imageCache.has(cacheKey)) {
      const imagePath = path.join(__dirname, `../images/${eventCount}.jpg`);
      const imageBuffer = await fs.readFile(imagePath);
      const image = sharp(imageBuffer);
      imageCache.set(cacheKey, image);

      if (imageCache.size > 10) {
        const firstKey = imageCache.keys().next().value;
        imageCache.delete(firstKey);
      }
    }

    logger.info(`Loaded base image for ${eventCount} events from cache or disk.`);
    return imageCache.get(cacheKey);
  } catch (error) {
    logger.error(`Error loading base image for event count ${eventCount}:`, error);
    throw new Error('Failed to load base image');
  }
};

const getBaseImagePath = async (eventCount) => {
  const imagePath = path.join(__dirname, `../images/${eventCount}.jpg`);
  return imagePath;
};

const getBaseImageBase64 = async (eventCount) => {
  const imagePath = await getBaseImagePath(eventCount);
  const imageBuffer = await fs.readFile(imagePath);
  const resizedBuffer = await sharp(imageBuffer)
    .resize(1200, 4000, { fit: 'cover' })
    .jpeg({ quality: 95 })
    .toBuffer();
  return resizedBuffer.toString('base64');
};

export const updateTicketImage = async (ticketUid, name, phone, price, eventCount, eventNames = []) => {
  try {
    console.log('Starting ticket generation with:', { ticketUid, name, eventCount, eventNames });

    const [baseImagePath, qrCodeBase64] = await Promise.all([
      getBaseImagePath(eventCount),
      generateQRCode(ticketUid, name, eventNames)
    ]);

    console.log('QR code and base image loaded successfully');

    const qrDataUrl = `data:image/png;base64,${qrCodeBase64}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Fest Ticket</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Poppins', sans-serif; 
            background: #000; 
            padding: 20px;
          }

          .ticket {
            width: 1200px;
            height: 4000px;
            position: relative;
            background: url('data:image/jpeg;base64,${await getBaseImageBase64(eventCount)}') center/cover no-repeat;
            overflow: hidden;
            border-radius: 32px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
            margin: 0 auto;
          }

          /* Dark gradient overlay for text readability */
          .overlay {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            height: 70%;
            background: linear-gradient(transparent, rgba(0,0,0,0.85));
            pointer-events: none;
          }

          /* Gold border & corners */
          .border {
            position: absolute;
            inset: 23px;
            border: 9px solid #FFD700;
            border-radius: 28px;
            pointer-events: none;
            box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
          }

          .corner {
            position: absolute;
            width: 115px; height: 115px;
            border: 8px solid #FFD700;
          }
          .tl { top: 51px; left: 51px; border-right: none; border-bottom: none; }
          .tr { top: 51px; right: 51px; border-left: none; border-bottom: none; }
          .bl { bottom: 51px; left: 51px; border-right: none; border-top: none; }
          .br { bottom: 51px; right: 51px; border-left: none; border-top: none; }

          /* Participant Info */
          .info {
            position: absolute;
            top: 593px;
            left: 90px;
            right: 90px;
            color: white;
            text-shadow: 2px 2px 10px rgba(0,0,0,0.9);
            z-index: 2;
            max-width: 1020px;
          }
          .name {
            font-size: 93px;
            font-weight: 800;
            margin-bottom: 21px;
            letter-spacing: 1px;
            color: #FFD700;
          }
          .detail {
            font-size: 49px;
            font-weight: 600;
            margin: 13px 0;
            color: #ffffff;
          }

          /* QR Code */
          .qr-container {
            position: absolute;
            top: 3160px;
            left: 410px;
            width: 384px;
            height: 384px;
            background: white;
            padding: 26px;
            border-radius: 26px;
            box-shadow: 0 12px 35px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .qr-container img {
            width: 333px;
            height: 333px;
          }

          /* Footer Branding */
          .footer {
            position: absolute;
            bottom: 130px;
            left: 0; right: 0;
            text-align: center;
            color: #FFD700;
            text-shadow: 2px 2px 10px rgba(0,0,0,0.9);
            z-index: 2;
          }
          .fest-title {
            font-size: 106px;
            font-weight: 800;
            letter-spacing: 3px;
          }
          .college {
            font-size: 49px;
            font-weight: 600;
            color: #ffffff;
            margin-top: 10px;
          }

          /* Decorative line */
          .divider {
            width: 520px;
            height: 4px;
            background: #FFD700;
            margin: 26px auto;
            border-radius: 2px;
          }

          /* Event names list */
          .events-list {
            margin-top: 30px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            border: 2px solid #FFD700;
          }
          .events-header {
            font-size: 45px;
            font-weight: 700;
            color: #FFD700;
            margin-bottom: 20px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .event-item {
            font-size: 38px;
            font-weight: 600;
            color: #ffffff;
            margin: 15px 0;
            padding: 15px 20px;
            background: rgba(255, 215, 0, 0.1);
            border-left: 5px solid #FFD700;
            border-radius: 8px;
            text-align: left;
          }
        </style>
      </head>
      <body>
        <div class="ticket">
          <div class="overlay"></div>
          <div class="border"></div>
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>

          <div class="info">
            <div class="name">${name.toUpperCase()}</div>
            <div class="detail">Ticket ID: ${ticketUid}</div>
            <div class="detail">Phone: ${phone}</div>
            <div class="detail">Price: ₹${price}</div>
            <div class="detail">Events Registered: ${eventCount}</div>
            ${eventNames.length > 0 ? `
              <div class="events-list">
                <div class="events-header">📋 Registered Events</div>
                ${eventNames.map(eventName => `<div class="event-item">✓ ${eventName}</div>`).join('')}
              </div>
            ` : ''}
          </div>

          <div class="qr-container">
            <img src="${qrDataUrl}" alt="QR Code" />
          </div>

          <div class="footer">
            <div class="fest-title">COLLEGE FEST 2025</div>
            <div class="divider"></div>
            <div class="college">Your College Name</div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('🎨 Starting Puppeteer browser...');
    
    const browser = await puppeteer.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security'] 
    });
    
    console.log('✅ Puppeteer browser launched successfully');
    
    const page = await browser.newPage();
    console.log('📄 Setting HTML content...');
    
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.setViewport({ width: 1200, height: 4000 });

    // Wait for fonts to load
    console.log('🔤 Waiting for fonts to load...');
    await page.evaluateHandle('document.fonts.ready');

    console.log('📸 Taking screenshot...');

    const screenshot = await page.screenshot({ 
      type: 'jpeg', 
      quality: 95,
      clip: { x: 0, y: 0, width: 1200, height: 4000 }
    });
    
    await browser.close();
    console.log('🔒 Browser closed');

    console.log('✅ Screenshot completed successfully, size:', screenshot.length, 'bytes');

    logger.info('Ticket image generated successfully with Puppeteer.');
    return screenshot;

  } catch (error) {
    logger.error('Error generating ticket image:', error);
    throw new Error('Failed to generate ticket image');
  }
};
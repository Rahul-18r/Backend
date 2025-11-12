import { generateQRCode } from './helpers/qrCodeGenerator.js';
import fs from 'fs';

// Test QR code generation
async function testQRCode() {
  console.log('Testing QR Code Generation...\n');
  
  const testTicketUid = 'FEST-20251110-TEST1234';
  const testName = 'Test User';
  const testEvents = ['Event 1', 'Event 2'];
  
  try {
    const qrCodeBase64 = await generateQRCode(testTicketUid, testName, testEvents);
    
    // Save QR code as PNG file
    const buffer = Buffer.from(qrCodeBase64, 'base64');
    fs.writeFileSync('test-qr-code.png', buffer);
    
    console.log('\n✅ QR Code saved as test-qr-code.png');
    console.log('   Scan this QR code to see the URL format!');
    console.log('   Expected URL: http://localhost:3069/verify?ticketUid=FEST-20251110-TEST1234');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testQRCode();

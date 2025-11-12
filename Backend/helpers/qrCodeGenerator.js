import QRCode from "qrcode";

export const generateQRCode = async (ticketUid, participantName, eventNames) => {
  try {
    // Create verification URL with ticketUid as query parameter
    // Format: http://localhost:3069/verify?ticketUid={ticketUid}
    // Or: https://yoursite.com/verify?ticketUid={ticketUid}
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3069';
    const verificationUrl = `${baseUrl}/verify?ticketUid=${ticketUid}`;
    
    console.log('🎯 QR CODE GENERATION:');
    console.log('   Ticket UID:', ticketUid);
    console.log('   Base URL:', baseUrl);
    console.log('   ✅ Final QR URL:', verificationUrl);
    console.log('   🚫 NOT generating JSON - Using URL format!');

    // Generate QR code with the verification URL (NOT JSON!)
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      color: {
        dark: '#000000',    // Black QR code
        light: '#FFFFFF'    // White background
      },
      margin: 1,
      width: 600,
      errorCorrectionLevel: 'H'
    });

    // Remove the "data:image/png;base64," prefix and return only the base64 string
    const base64Image = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    
    console.log('   ✅ QR Code generated successfully (URL format)');
    
    return base64Image;

  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
};
import { updateTicketImage } from '../helpers/imageUpdation.js';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateTicket = async (ticketUid, name, phone, price, eventCount, order_id, eventNames = []) => {
  try {
    logger.info(`Generating ticket for ticketUid: ${ticketUid}`);

    // Generate the updated ticket image buffer directly
    const updatedImageBuffer = await updateTicketImage(ticketUid, name, phone, price, eventCount, eventNames);

    logger.info('Ticket image updated successfully', {
      ticketUid,
      name,
      phone,
      eventCount,
      price,
    });

    // Save to local file system instead of S3
    const ticketsDir = path.join(__dirname, '../tickets');
    
    // Create tickets directory if it doesn't exist
    try {
      await fs.access(ticketsDir);
    } catch {
      await fs.mkdir(ticketsDir, { recursive: true });
      console.log('✅ Created tickets directory:', ticketsDir);
    }

    const fileName = `${order_id}.jpg`;
    const filePath = path.join(ticketsDir, fileName);
    
    // Save the image buffer to file
    await fs.writeFile(filePath, updatedImageBuffer);
    
    // Generate URL for accessing the ticket
    const ticketUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payment/ticket/image/${order_id}`;
    
    console.log('✅ Ticket saved locally:', filePath);
    console.log('✅ Ticket URL:', ticketUrl);

    logger.info('Ticket generated successfully', { ticketUrl, filePath });

    return ticketUrl;
  } catch (error) {
    logger.error('Error generating ticket:', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate ticket');
  }
};

export const generateTicketBuffer = async (ticketUid, name, phone, price, eventCount, eventNames = []) => {
  try {
    logger.info(`Generating ticket buffer for ticketUid: ${ticketUid}`);

    // Generate the updated ticket image buffer directly
    const updatedImageBuffer = await updateTicketImage(ticketUid, name, phone, price, eventCount, eventNames);

    logger.info('Ticket image buffer generated successfully', {
      ticketUid,
      name,
      phone,
      eventCount,
      price,
    });

    return updatedImageBuffer;
  } catch (error) {
    logger.error('Error generating ticket buffer:', { error: error.message, stack: error.stack });
    throw new Error('Failed to generate ticket buffer');
  }
};

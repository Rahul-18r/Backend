import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = ({ onClose, onScanSuccess }) => {
  const [scanning, setScanning] = useState(true);
  const [manualId, setManualId] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!showManual && scanning) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [showManual, scanning]);

  const startScanner = async () => {
    try {
      setCameraError('');
      const html5QrCode = new Html5Qrcode('qr-reader');
      scannerRef.current = html5QrCode;

      // Request camera permission and start scanning
      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            console.log('QR Code scanned:', decodedText);
            handleScanResult(decodedText);
          }
        },
        (errorMessage) => {
          // Ignore scanning errors - they're normal during scanning
        }
      );

      setScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please check permissions or use manual entry.');
      setShowManual(true);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const handleScanResult = (scannedData) => {
    // Extract ticket ID from QR code
    let extractedId = scannedData;
    
    // If QR contains URL or other data, extract the ticket ID
    if (scannedData.includes('FEST-')) {
      const match = scannedData.match(/FEST-\d{8}-[A-F0-9]{8}/i);
      if (match) {
        extractedId = match[0];
      }
    }

    stopScanner();
    onScanSuccess(extractedId);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      onScanSuccess(manualId.trim());
    }
  };

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-modal">
        <div className="qr-scanner-header">
          <h2>🎫 {showManual ? 'Manual Check-In' : 'Scan QR Code'}</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="qr-scanner-content">
          {!showManual ? (
            <>
              {cameraError && (
                <div className="error-message">{cameraError}</div>
              )}
              <div id="qr-reader" className="qr-reader"></div>
              <div className="scanner-actions">
                <button 
                  onClick={() => {
                    stopScanner();
                    setShowManual(true);
                  }} 
                  className="manual-entry-btn"
                >
                  📝 Enter Manually
                </button>
              </div>
            </>
          ) : (
            <div className="manual-entry">
              <form onSubmit={handleManualSubmit}>
                <div className="form-group">
                  <label htmlFor="ticketId">Ticket ID / Phone Number</label>
                  <input
                    type="text"
                    id="ticketId"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="Enter Ticket ID or Phone Number"
                    autoFocus
                    required
                  />
                  <small className="input-hint">Format: FEST-20251110-A3B2C1D4 or 10-digit phone</small>
                </div>
                <div className="manual-actions">
                  <button type="submit" className="submit-btn">
                    ✓ Check In
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setShowManual(false);
                      setManualId('');
                      hasScannedRef.current = false;
                    }} 
                    className="back-to-scan-btn"
                  >
                    📷 Scan QR Code
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

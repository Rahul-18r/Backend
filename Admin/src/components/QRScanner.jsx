import { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './QRScanner.css';

const QRScanner = ({ onClose, onScanSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [manualFestId, setManualFestId] = useState('');
  const [useManual, setUseManual] = useState(false);

  useEffect(() => {
    if (!useManual) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [useManual]);

  const startScanner = () => {
    const scanner = new Html5QrcodeScanner('qr-reader', {
      qrbox: {
        width: 250,
        height: 250
      },
      fps: 5,
    });

    scanner.render((decodedText) => {
      console.log('QR Code scanned:', decodedText);
      handleScanResult(decodedText);
      scanner.clear();
    }, (error) => {
      // Ignore errors - they're expected during scanning
    });

    setScanning(true);
  };

  const stopScanner = () => {
    try {
      const elem = document.getElementById('qr-reader');
      if (elem) {
        elem.innerHTML = '';
      }
      setScanning(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const handleScanResult = (festId) => {
    // Extract Fest ID from QR code (assuming format includes Fest ID)
    let extractedFestId = festId;
    
    // If QR contains URL or other data, extract the Fest ID
    if (festId.includes('FEST-')) {
      const match = festId.match(/FEST-\d{8}-[A-F0-9]{8}/i);
      if (match) {
        extractedFestId = match[0];
      }
    }

    onScanSuccess(extractedFestId);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualFestId.trim()) {
      handleScanResult(manualFestId.trim());
    }
  };

  return (
    <div className="qr-scanner-overlay">
      <div className="qr-scanner-modal">
        <div className="qr-scanner-header">
          <h2>🎫 Scan QR Code</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="qr-scanner-content">
          {!useManual ? (
            <>
              <div id="qr-reader" className="qr-reader"></div>
              <button 
                onClick={() => setUseManual(true)} 
                className="switch-mode-btn"
              >
                Enter Fest ID Manually
              </button>
            </>
          ) : (
            <div className="manual-entry">
              <form onSubmit={handleManualSubmit}>
                <div className="form-group">
                  <label htmlFor="festId">Ticket ID / Order ID / Phone Number</label>
                  <input
                    type="text"
                    id="festId"
                    value={manualFestId}
                    onChange={(e) => setManualFestId(e.target.value)}
                    placeholder="Enter Ticket ID, Order ID, or Phone Number"
                    required
                  />
                </div>
                <button type="submit" className="submit-btn">
                  Check In
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setUseManual(false);
                    setManualFestId('');
                  }} 
                  className="switch-mode-btn"
                >
                  Scan QR Code Instead
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner;

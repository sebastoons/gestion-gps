import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const scannerId = useRef('bs_' + Math.random().toString(36).slice(2)).current;
  const html5QrcodeRef = useRef(null);
  const isScanningRef = useRef(false);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onScanSuccessRef.current = onScanSuccess; }, [onScanSuccess]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const stopScanner = async () => {
    if (html5QrcodeRef.current && isScanningRef.current) {
      try { await html5QrcodeRef.current.stop(); } catch (e) {}
      isScanningRef.current = false;
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onCloseRef.current();
  };

  useEffect(() => {
    const id = scannerId;
    const startScanner = async () => {
      try {
        const qr = new Html5Qrcode(id);
        html5QrcodeRef.current = qr;
        const config = { fps: 10, qrbox: { width: 260, height: 90 }, formatsToSupport: [0,1,2,3,4,5,6,7,8] };
        const onDecode = async (text) => {
          await stopScanner();
          onScanSuccessRef.current(text.trim());
          onCloseRef.current();
        };
        try {
          await qr.start({ facingMode: { exact: 'environment' } }, config, onDecode, () => {});
        } catch {
          await qr.start({ facingMode: 'environment' }, config, onDecode, () => {});
        }
        isScanningRef.current = true;
      } catch (err) {
        console.error('Scanner error:', err);
        onCloseRef.current();
      }
    };
    startScanner();
    return () => {
      if (html5QrcodeRef.current && isScanningRef.current) {
        html5QrcodeRef.current.stop().catch(() => {});
        isScanningRef.current = false;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <div className="scanner-header">
          <h3 className="scanner-title">Escanear Código de Barras</h3>
          <button onClick={handleClose} className="scanner-close-btn">
            <X size={24} />
          </button>
        </div>
        <div className="scanner-instructions">
          <p>• Coloca el código dentro del recuadro</p>
          <p>• Buena iluminación y dispositivo estable</p>
        </div>
        <div
          id={scannerId}
          className="barcode-scanner-inner"
          style={{ pointerEvents: 'none' }}
        ></div>
        <div className="scanner-manual-option">
          <p>¿Problemas con el escáner?</p>
          <button onClick={handleClose} className="btn btn-secondary">
            Ingresar manualmente
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;

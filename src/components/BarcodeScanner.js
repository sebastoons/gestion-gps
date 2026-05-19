import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const scannerDivRef = useRef(null);
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
    const startScanner = async () => {
      try {
        const qr = new Html5Qrcode('barcode-scanner');
        html5QrcodeRef.current = qr;

        const config = {
          fps: 10,
          qrbox: { width: 260, height: 90 },
          formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8],
        };

        const onDecode = async (text) => {
          const val = text.trim();
          await stopScanner();
          onScanSuccessRef.current(val);
          onCloseRef.current();
        };

        try {
          await qr.start({ facingMode: { exact: 'environment' } }, config, onDecode, () => {});
        } catch {
          await qr.start({ facingMode: 'environment' }, config, onDecode, () => {});
        }
        isScanningRef.current = true;
      } catch (err) {
        console.error('Error al iniciar escáner:', err);
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
          <p>• Coloca el código de barras dentro del recuadro</p>
          <p>• Asegúrate de tener buena iluminación</p>
          <p>• Mantén el dispositivo estable</p>
        </div>

        <div id="barcode-scanner" ref={scannerDivRef}></div>

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

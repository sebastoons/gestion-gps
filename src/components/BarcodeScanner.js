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
        const config = {
          fps: 15,
          qrbox: { width: 280, height: 100 },
          formatsToSupport: [0,1,2,3,4,5,6,7,8],
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 },
            focusMode: 'continuous',
            advanced: [{ focusMode: 'continuous' }],
          },
        };
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
        // Forzar auto-foco continuo en el track activo
        try {
          await qr.applyVideoConstraints({
            advanced: [{ focusMode: 'continuous' }],
          });
        } catch (_) {}
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

        <p style={{ fontFamily:'Quantico', fontSize:'0.6em', textTransform:'uppercase', color:'#6b7280', textAlign:'center', margin:'0 0 8px' }}>
          Centra el código de barras dentro del recuadro
        </p>

        {/* Scanner + frame overlay */}
        <div style={{ position:'relative' }}>
          <div id={scannerId} className="barcode-scanner-inner" style={{ pointerEvents:'none' }}></div>
          <div className="scan-frame-overlay">
            <div className="scan-frame-box">
              <span className="sc-corner sc-tl" />
              <span className="sc-corner sc-tr" />
              <span className="sc-corner sc-bl" />
              <span className="sc-corner sc-br" />
              <span className="sc-line" />
            </div>
          </div>
        </div>

        <div className="scanner-manual-option">
          <p>¿Problemas con el escáner?</p>
          <button onClick={handleClose} className="btn btn-secondary">Ingresar manualmente</button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;

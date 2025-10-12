import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    // Configuración del escáner
    const config = {
      fps: 10, // Frames por segundo
      qrbox: { width: 250, height: 150 }, // Área de escaneo
      aspectRatio: 1.777778, // 16:9
      formatsToSupport: [
        // Formatos de códigos de barras
        0, // CODE_128
        1, // CODE_39
        2, // CODE_93
        3, // CODABAR
        4, // EAN_13
        5, // EAN_8
        6, // ITF
        7, // UPC_A
        8, // UPC_E
      ]
    };

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "barcode-scanner",
      config,
      false // verbose = false para no mostrar logs excesivos
    );

    html5QrcodeScannerRef.current = html5QrcodeScanner;

    // Función que se ejecuta al escanear exitosamente
    const onScanSuccessHandler = (decodedText, decodedResult) => {
      console.log(`Código escaneado: ${decodedText}`, decodedResult);
      
      // Limpiar el texto escaneado (remover espacios extra)
      const cleanedText = decodedText.trim();
      
      // Validar que sea un IMEI válido (15 dígitos)
      if (/^\d{15}$/.test(cleanedText)) {
        onScanSuccess(cleanedText);
        html5QrcodeScanner.clear();
        onClose();
      } else {
        // Si no es un IMEI válido, aún así lo pasamos
        // pero mostramos una advertencia
        if (window.confirm(`El código escaneado (${cleanedText}) no parece un IMEI válido de 15 dígitos. ¿Desea usarlo de todos modos?`)) {
          onScanSuccess(cleanedText);
          html5QrcodeScanner.clear();
          onClose();
        }
      }
    };

    // Función de error (opcional)
    const onScanError = (errorMessage) => {
      // Silenciar errores comunes de escaneo
      // console.warn(`Error de escaneo: ${errorMessage}`);
    };

    // Iniciar el escáner
    html5QrcodeScanner.render(onScanSuccessHandler, onScanError);

    // Cleanup al desmontar
    return () => {
      if (html5QrcodeScannerRef.current) {
        html5QrcodeScannerRef.current.clear().catch(err => {
          console.error("Error al limpiar el escáner:", err);
        });
      }
    };
  }, [onScanSuccess, onClose]);

  return (
    <div className="scanner-overlay">
      <div className="scanner-container">
        <div className="scanner-header">
          <h3 className="scanner-title">Escanear Código de Barras IMEI</h3>
          <button onClick={onClose} className="scanner-close-btn">
            <X size={24} />
          </button>
        </div>
        
        <div className="scanner-instructions">
          <p>• Coloca el código de barras del IMEI dentro del recuadro</p>
          <p>• Asegúrate de tener buena iluminación</p>
          <p>• Mantén el dispositivo estable</p>
        </div>

        <div id="barcode-scanner" ref={scannerRef}></div>

        <div className="scanner-manual-option">
          <p>¿Problemas con el escáner?</p>
          <button onClick={onClose} className="btn btn-secondary">
            Ingresar manualmente
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
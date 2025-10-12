import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  useEffect(() => {
    let html5QrCode = null;
    let isScanning = false; // Flag para saber si el escáner está corriendo

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode("barcode-scanner");
        html5QrcodeRef.current = html5QrCode;

        // Configuración del escáner
        const config = {
          fps: 10,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.777778,
          formatsToSupport: [
            0, 1, 2, 3, 4, 5, 6, 7, 8, // Todos los formatos de códigos de barras
          ]
        };

        // Función que se ejecuta al escanear exitosamente
        const onScanSuccessHandler = (decodedText, decodedResult) => {
          console.log(`Código escaneado: ${decodedText}`, decodedResult);
          
          const cleanedText = decodedText.trim();
          
          // Validar que sea un IMEI válido (15 dígitos)
          if (/^\d{15}$/.test(cleanedText)) {
            onScanSuccess(cleanedText);
            if (isScanning) {
              html5QrCode.stop().then(() => {
                isScanning = false;
                onClose();
              }).catch(err => console.error("Error al detener:", err));
            } else {
              onClose();
            }
          } else {
            // Si no es un IMEI válido, aún así lo pasamos con confirmación
            if (window.confirm(`El código escaneado (${cleanedText}) no parece un IMEI válido de 15 dígitos. ¿Desea usarlo de todos modos?`)) {
              onScanSuccess(cleanedText);
              if (isScanning) {
                html5QrCode.stop().then(() => {
                  isScanning = false;
                  onClose();
                }).catch(err => console.error("Error al detener:", err));
              } else {
                onClose();
              }
            }
          }
        };

        const onScanError = (errorMessage) => {
          // Silenciar errores comunes de escaneo
        };

        // Intentar usar la cámara trasera directamente
        try {
          // Primero intentamos con facingMode environment (cámara trasera)
          await html5QrCode.start(
            { facingMode: "environment" }, // Esto fuerza la cámara trasera
            config,
            onScanSuccessHandler,
            onScanError
          );
          isScanning = true; // Marcamos que el escáner está corriendo
        } catch (err) {
          console.log("No se pudo usar facingMode, intentando con lista de cámaras...");
          
          // Si falla, obtenemos la lista de cámaras y seleccionamos la trasera
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            // Buscar cámara trasera por etiqueta
            let backCamera = devices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('rear') ||
              device.label.toLowerCase().includes('trasera')
            );
            
            // Si no encuentra por etiqueta, usar la última (generalmente es la trasera en móviles)
            if (!backCamera && devices.length > 0) {
              backCamera = devices[devices.length - 1]; // Última cámara suele ser trasera
            }
            
            const cameraId = backCamera ? backCamera.id : devices[0].id;
            
            await html5QrCode.start(
              cameraId,
              config,
              onScanSuccessHandler,
              onScanError
            );
            isScanning = true; // Marcamos que el escáner está corriendo
          } else {
            throw new Error("No se encontraron cámaras disponibles");
          }
        }
      } catch (err) {
        console.error("Error al iniciar el escáner:", err);
        alert("Error al acceder a la cámara. Por favor, verifica los permisos de cámara en tu dispositivo.");
        onClose();
      }
    };

    startScanner();

    // Cleanup al desmontar
    return () => {
      if (html5QrcodeRef.current && isScanning) {
        // Solo intentamos detener si el escáner realmente está corriendo
        html5QrcodeRef.current.stop().catch(err => {
          // Silenciamos este error porque es normal que ocurra si el escáner no inició
          console.log("El escáner ya estaba detenido");
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
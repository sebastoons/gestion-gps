// Utilidad para exportar tabla visual como imagen o PDF
// Replica exactamente el diseño de la app

export const exportToVisualPDF = async (elementId, filename, options = {}) => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      alert('❌ Error: No se encontró el elemento a exportar');
      return;
    }

    // Opciones por defecto
    const defaultOptions = {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      ...options
    };

    // Capturar el elemento como canvas
    const canvas = await window.html2canvas(element, defaultOptions);
    
    // Crear PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new window.jspdf.jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calcular dimensiones para que quepa en la página
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // 10mm de margen a cada lado
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Si la imagen es muy alta, dividir en páginas
    if (imgHeight > pageHeight - 20) {
      let position = 10;
      let remainingHeight = imgHeight;
      let pageNumber = 1;

      while (remainingHeight > 0) {
        if (pageNumber > 1) {
          pdf.addPage();
        }
        
        const currentPageHeight = Math.min(remainingHeight, pageHeight - 20);
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        
        remainingHeight -= currentPageHeight;
        position += currentPageHeight;
        pageNumber++;
      }
    } else {
      // Si cabe en una página
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    }

    pdf.save(`${filename}.pdf`);
    alert('✓ PDF exportado correctamente');
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('❌ Error al generar el PDF. Por favor intenta nuevamente.');
  }
};

export const exportToVisualImage = async (elementId, filename, options = {}) => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      alert('❌ Error: No se encontró el elemento a exportar');
      return;
    }

    // Opciones por defecto
    const defaultOptions = {
      scale: 3,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      ...options
    };

    // Capturar el elemento como canvas
    const canvas = await window.html2canvas(element, defaultOptions);
    
    // Convertir a imagen y descargar
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
      alert('✓ Imagen exportada correctamente');
    }, 'image/jpeg', 0.95);
  } catch (error) {
    console.error('Error al exportar imagen:', error);
    alert('❌ Error al generar la imagen. Por favor intenta nuevamente.');
  }
};

// Función auxiliar para preparar el elemento antes de exportar
export const prepareElementForExport = (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) return null;

  // Clonar el elemento para no afectar la vista actual
  const clone = element.cloneNode(true);
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  document.body.appendChild(clone);

  return clone;
};

export const cleanupClonedElement = (clone) => {
  if (clone && clone.parentNode) {
    clone.parentNode.removeChild(clone);
  }
};
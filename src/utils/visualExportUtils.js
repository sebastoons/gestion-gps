// Utilidad para exportar tabla visual como imagen o PDF
// Replica exactamente el diseño de la app

// Función para crear un clon expandido del elemento
const createExpandedClone = (element) => {
  // Clonar el elemento
  const clone = element.cloneNode(true);
  
  // Aplicar estilos al clon para que se renderice completamente
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = 'auto';
  clone.style.minWidth = '1200px'; // Ancho mínimo para tablas
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.backgroundColor = 'white';
  clone.style.padding = '40px';
  clone.style.boxShadow = 'none';
  
  // Remover restricciones de todos los contenedores internos
  const containers = clone.querySelectorAll('.table-container, .summary-container, div[style*="overflow"]');
  containers.forEach(container => {
    container.style.overflow = 'visible';
    container.style.overflowX = 'visible';
    container.style.overflowY = 'visible';
    container.style.maxHeight = 'none';
    container.style.height = 'auto';
  });
  
  // Asegurar que la tabla sea visible completamente
  const tables = clone.querySelectorAll('table');
  tables.forEach(table => {
    table.style.width = '100%';
    table.style.tableLayout = 'auto';
  });
  
  // Agregar el clon al body
  document.body.appendChild(clone);
  
  return clone;
};

export const exportToVisualPDF = async (elementId, filename, options = {}) => {
  let clone = null;
  
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      alert('❌ Error: No se encontró el elemento a exportar');
      return;
    }

    // Crear clon expandido del elemento
    clone = createExpandedClone(element);

    // Esperar a que el DOM se actualice con el clon
    await new Promise(resolve => setTimeout(resolve, 200));

    // Opciones optimizadas para captura
    const captureOptions = {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
      ...options
    };

    // Capturar el clon como canvas
    const canvas = await window.html2canvas(clone, captureOptions);

    // Crear PDF en orientación horizontal (landscape)
    const pdf = new window.jspdf.jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Calcular dimensiones
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const imgWidth = pageWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Convertir canvas a imagen
    const imgData = canvas.toDataURL('image/png', 1.0);

    // Si la imagen es muy alta, dividir en múltiples páginas
    if (imgHeight > pageHeight - (margin * 2)) {
      const pageContentHeight = pageHeight - (margin * 2);
      const totalPages = Math.ceil(imgHeight / pageContentHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        // Calcular qué porción de la imagen va en esta página
        const sourceY = (i * pageContentHeight * canvas.width) / imgWidth;
        const sourceHeight = Math.min(
          (pageContentHeight * canvas.width) / imgWidth,
          canvas.height - sourceY
        );

        // Crear canvas temporal para esta página
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;

        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(
          canvas,
          0, sourceY,
          canvas.width, sourceHeight,
          0, 0,
          canvas.width, sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL('image/png', 1.0);
        const actualHeight = (sourceHeight * imgWidth) / canvas.width;

        pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, actualHeight);
      }
    } else {
      // Si cabe en una sola página
      pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
    }

    // Guardar el PDF
    pdf.save(`${filename}.pdf`);
    alert('✓ PDF exportado correctamente con toda la tabla visible');
    
  } catch (error) {
    console.error('Error al exportar PDF:', error);
    alert('❌ Error al generar el PDF. Por favor intenta nuevamente.');
  } finally {
    // Remover el clon del DOM
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
};

export const exportToVisualImage = async (elementId, filename, options = {}) => {
  let clone = null;
  
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      alert('❌ Error: No se encontró el elemento a exportar');
      return;
    }

    // Crear clon expandido del elemento
    clone = createExpandedClone(element);

    // Esperar a que el DOM se actualice con el clon
    await new Promise(resolve => setTimeout(resolve, 200));

    // Opciones optimizadas para captura de alta calidad
    const captureOptions = {
      scale: 3, // Alta resolución para imágenes
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
      ...options
    };

    // Capturar el clon como canvas
    const canvas = await window.html2canvas(clone, captureOptions);
    
    // Convertir a imagen y descargar
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.jpg`;
      link.click();
      URL.revokeObjectURL(url);
      alert('✓ Imagen exportada correctamente con toda la tabla visible');
    }, 'image/jpeg', 0.95);
    
  } catch (error) {
    console.error('Error al exportar imagen:', error);
    alert('❌ Error al generar la imagen. Por favor intenta nuevamente.');
  } finally {
    // Remover el clon del DOM
    if (clone && clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
};
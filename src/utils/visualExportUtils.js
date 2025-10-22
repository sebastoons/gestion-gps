// Utilidad para exportar tabla visual como imagen o PDF
// Replica exactamente el diseño de la app

// Función auxiliar para preparar el elemento antes de capturar
const prepareElementForCapture = (element) => {
  // Guardar estilos originales
  const originalStyles = {
    overflow: element.style.overflow,
    height: element.style.height,
    maxHeight: element.style.maxHeight,
    width: element.style.width
  };

  // Encontrar todos los contenedores con scroll
  const scrollContainers = element.querySelectorAll('.table-container, .summary-container');
  const scrollStyles = [];

  scrollContainers.forEach((container) => {
    scrollStyles.push({
      element: container,
      overflow: container.style.overflow,
      overflowX: container.style.overflowX,
      overflowY: container.style.overflowY,
      maxHeight: container.style.maxHeight,
      height: container.style.height
    });

    // Remover restricciones de scroll para capturar todo el contenido
    container.style.overflow = 'visible';
    container.style.overflowX = 'visible';
    container.style.overflowY = 'visible';
    container.style.maxHeight = 'none';
    container.style.height = 'auto';
  });

  // Remover restricciones del elemento principal
  element.style.overflow = 'visible';
  element.style.height = 'auto';
  element.style.maxHeight = 'none';
  element.style.width = 'auto';

  return { originalStyles, scrollStyles };
};

// Función auxiliar para restaurar estilos originales
const restoreElementStyles = (element, savedStyles) => {
  const { originalStyles, scrollStyles } = savedStyles;

  // Restaurar estilos del elemento principal
  element.style.overflow = originalStyles.overflow;
  element.style.height = originalStyles.height;
  element.style.maxHeight = originalStyles.maxHeight;
  element.style.width = originalStyles.width;

  // Restaurar estilos de contenedores con scroll
  scrollStyles.forEach((style) => {
    style.element.style.overflow = style.overflow;
    style.element.style.overflowX = style.overflowX;
    style.element.style.overflowY = style.overflowY;
    style.element.style.maxHeight = style.maxHeight;
    style.element.style.height = style.height;
  });
};

export const exportToVisualPDF = async (elementId, filename, options = {}) => {
  try {
    const element = document.getElementById(elementId);
    
    if (!element) {
      alert('❌ Error: No se encontró el elemento a exportar');
      return;
    }

    // Preparar el elemento para captura (remover scrolls temporalmente)
    const savedStyles = prepareElementForCapture(element);

    // Esperar un momento para que el DOM se actualice
    await new Promise(resolve => setTimeout(resolve, 100));

    // Opciones por defecto
    const defaultOptions = {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      ...options
    };

    // Capturar el elemento como canvas
    const canvas = await window.html2canvas(element, defaultOptions);
    
    // Restaurar estilos originales
    restoreElementStyles(element, savedStyles);

    // Crear PDF en orientación horizontal para tablas anchas
    const pdf = new window.jspdf.jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Calcular dimensiones para que quepa en la página
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20; // 10mm de margen a cada lado
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Convertir canvas a imagen
    const imgData = canvas.toDataURL('image/png');

    // Si la imagen es muy alta, dividir en múltiples páginas
    if (imgHeight > pageHeight - 20) {
      const pageImgHeight = pageHeight - 20;
      const totalPages = Math.ceil(imgHeight / pageImgHeight);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          pdf.addPage();
        }

        const sourceY = (i * pageImgHeight * canvas.width) / imgWidth;
        const sourceHeight = (pageImgHeight * canvas.width) / imgWidth;

        // Crear un canvas temporal para cada página
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(sourceHeight, canvas.height - sourceY);

        const ctx = pageCanvas.getContext('2d');
        ctx.drawImage(
          canvas,
          0, sourceY,
          canvas.width, pageCanvas.height,
          0, 0,
          canvas.width, pageCanvas.height
        );

        const pageImgData = pageCanvas.toDataURL('image/png');
        const actualHeight = (pageCanvas.height * imgWidth) / canvas.width;

        pdf.addImage(pageImgData, 'PNG', 10, 10, imgWidth, actualHeight);
      }
    } else {
      // Si cabe en una página
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    }

    pdf.save(`${filename}.pdf`);
    alert('✓ PDF exportado correctamente con toda la tabla visible');
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

    // Preparar el elemento para captura (remover scrolls temporalmente)
    const savedStyles = prepareElementForCapture(element);

    // Esperar un momento para que el DOM se actualice
    await new Promise(resolve => setTimeout(resolve, 100));

    // Opciones por defecto
    const defaultOptions = {
      scale: 3,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      ...options
    };

    // Capturar el elemento como canvas
    const canvas = await window.html2canvas(element, defaultOptions);
    
    // Restaurar estilos originales
    restoreElementStyles(element, savedStyles);
    
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
  }
};
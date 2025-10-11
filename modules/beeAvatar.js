// Módulo para generar el avatar de abeja (WriteBee)
const BeeAvatar = (function() {
  
  // Genera el SVG del avatar de abeja
  function generateSVG(size = 32) {
    const center = size / 2;
    const radius = size / 2;
    const antennaHeight = size / 4;
    const antennaSpacing = size / 6;
    const antennaWidth = size / 20;
    const ballRadius = size / 12;
    const eyeRadius = size / 10.66;
    const eyeY = center - size / 16;
    const eyeSpacing = size / 3.2;
    
    // SVG optimizado para el avatar de abeja
    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="display: block;">
        <!-- Antena izquierda -->
        <line x1="${center - antennaSpacing}" y1="${center - radius + antennaHeight}" 
              x2="${center - antennaSpacing * 1.5}" y2="${center - radius - antennaHeight / 3}" 
              stroke="#ffffff" stroke-width="${antennaWidth}" stroke-linecap="round"/>
        <circle cx="${center - antennaSpacing * 1.5}" cy="${center - radius - antennaHeight / 3}" 
                r="${ballRadius}" fill="#ffffff"/>
        
        <!-- Antena derecha -->
        <line x1="${center + antennaSpacing}" y1="${center - radius + antennaHeight}" 
              x2="${center + antennaSpacing * 1.5}" y2="${center - radius - antennaHeight / 3}" 
              stroke="#ffffff" stroke-width="${antennaWidth}" stroke-linecap="round"/>
        <circle cx="${center + antennaSpacing * 1.5}" cy="${center - radius - antennaHeight / 3}" 
                r="${ballRadius}" fill="#ffffff"/>
        
        <!-- Cara amarilla -->
        <circle cx="${center}" cy="${center}" r="${radius}" fill="#ffd400"/>
        
        <!-- Borde negro exterior -->
        <circle cx="${center}" cy="${center}" r="${radius - size / 40}" 
                fill="none" stroke="#1a1a1a" stroke-width="${size / 20}"/>
        
        <!-- Borde negro interior -->
        <circle cx="${center}" cy="${center}" r="${radius - size / 8}" 
                fill="none" stroke="#1a1a1a" stroke-width="${size / 25}"/>
        
        <!-- Ojo izquierdo -->
        <circle cx="${center - eyeSpacing / 2}" cy="${eyeY}" r="${eyeRadius}" fill="#1a1a1a"/>
        
        <!-- Ojo derecho -->
        <circle cx="${center + eyeSpacing / 2}" cy="${eyeY}" r="${eyeRadius}" fill="#1a1a1a"/>
      </svg>
    `.trim();
  }
  
  // Genera el HTML completo del avatar con el div contenedor
  function generateHTML(size = 32) {
    return `<div class="ai-avatar-bee" style="width: ${size}px; height: ${size}px;">${generateSVG(size)}</div>`;
  }
  
  // API pública
  return {
    generateSVG,
    generateHTML
  };
})();

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
  window.BeeAvatar = BeeAvatar;
}



// Script de debugging para WhatsApp Audio
// Pega esto en la consola de WhatsApp Web después de hacer clic en un mensaje de audio

console.log('=== DEBUG WHATSAPP AUDIO ===');

// 1. Encontrar mensaje de audio
const audioButton = document.querySelector('[aria-label*="Reproducir mensaje de voz"]');
console.log('1. Botón de audio encontrado:', audioButton);

if (audioButton) {
  const messageContainer = audioButton.closest('div.focusable-list-item') || 
                          audioButton.closest('div[class*="message-"]');
  console.log('2. Contenedor del mensaje:', messageContainer);
  
  // 3. Buscar todos los elementos de audio
  const audioElements = messageContainer.querySelectorAll('audio');
  console.log('3. Elementos <audio> encontrados:', audioElements.length);
  audioElements.forEach((audio, i) => {
    console.log(`   Audio ${i}:`, {
      src: audio.src,
      currentSrc: audio.currentSrc,
      duration: audio.duration,
      readyState: audio.readyState
    });
  });
  
  // 4. Buscar elementos con src
  const elementsWithSrc = messageContainer.querySelectorAll('[src]');
  console.log('4. Elementos con src:', elementsWithSrc.length);
  elementsWithSrc.forEach((el, i) => {
    console.log(`   Elemento ${i} (${el.tagName}):`, el.src);
  });
  
  // 5. Estructura HTML del mensaje
  console.log('5. HTML del contenedor:', messageContainer.outerHTML.substring(0, 500));
  
  // 6. Simular clic y ver qué pasa
  console.log('6. Simulando clic en reproducir...');
  audioButton.click();
  
  setTimeout(() => {
    const audioAfterClick = messageContainer.querySelectorAll('audio');
    console.log('7. Elementos <audio> después del clic:', audioAfterClick.length);
    audioAfterClick.forEach((audio, i) => {
      console.log(`   Audio ${i} después del clic:`, {
        src: audio.src,
        currentSrc: audio.currentSrc,
        duration: audio.duration,
        readyState: audio.readyState,
        paused: audio.paused
      });
    });
    
    // Pausar si está reproduciendo
    audioAfterClick.forEach(audio => {
      if (!audio.paused) {
        audio.pause();
        console.log('   Audio pausado');
      }
    });
  }, 2000);
}

// 8. Buscar en todo el documento
setTimeout(() => {
  console.log('8. Todos los elementos <audio> en la página:');
  const allAudios = document.querySelectorAll('audio');
  allAudios.forEach((audio, i) => {
    console.log(`   Audio global ${i}:`, {
      src: audio.src,
      currentSrc: audio.currentSrc,
      duration: audio.duration
    });
  });
}, 3000);

console.log('=== FIN DEBUG ===');
console.log('Espera 3 segundos para ver todos los resultados...');

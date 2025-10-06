const FloatButtonModule = (function() {
  let floatButton = null;

  function createFloatButton() {
    if (floatButton) return;

    floatButton = document.createElement('button');
    floatButton.className = 'ai-float-btn';
    floatButton.setAttribute('aria-label', 'Abrir AI Chat');
    floatButton.innerHTML = `
      <div class="ai-float-mascot" aria-hidden="true">
        <div class="ai-float-mascot-inner">
          <span class="ai-float-mouth" aria-hidden="true"></span>
        </div>
      </div>
      <span class="ai-float-label">Ctrl+M</span>
    `;

    floatButton.addEventListener('click', openSidePanel);
    document.body.appendChild(floatButton);

    // Agregar atajo de teclado Ctrl+M
    document.addEventListener('keydown', handleKeyboard);
  }

  function handleKeyboard(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
      e.preventDefault();
      openSidePanel();
    }
  }

  function openSidePanel() {
    try {
      chrome.runtime.sendMessage({
        action: 'openSidePanel',
        data: null // Sin datos = nueva conversación
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error de runtime:', chrome.runtime.lastError);
          alert('⚠️ La extensión fue recargada.\n\nPor favor recarga esta página (F5) para continuar usando el chat.');
          return;
        }

        if (response && response.success) {
          console.log('✅ Side panel abierto correctamente');
        } else {
          console.error('❌ Error abriendo side panel:', response?.error);
        }
      });
    } catch (error) {
      console.error('❌ Error fatal al abrir side panel:', error);
      if (error.message.includes('Extension context invalidated')) {
        alert('⚠️ La extensión fue recargada.\n\nPor favor recarga esta página (F5) para continuar usando el chat.');
      } else {
        alert('Error al abrir chat: ' + error.message);
      }
    }
  }

  function removeFloatButton() {
    if (floatButton) {
      floatButton.remove();
      floatButton = null;
    }
    document.removeEventListener('keydown', handleKeyboard);
  }

  // Crear el botón automáticamente al cargar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatButton);
  } else {
    createFloatButton();
  }

  return {
    createFloatButton,
    removeFloatButton
  };
})();

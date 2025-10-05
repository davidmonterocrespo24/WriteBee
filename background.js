// Background Service Worker para manejar el side panel

// Variable temporal para almacenar datos para el side panel
let pendingChatData = null;

// Listener para mensajes desde content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    // Guardar datos temporalmente
    if (request.data) {
      pendingChatData = request.data;
    }

    // Abrir el side panel en la pestaña actual
    chrome.sidePanel.open({ windowId: sender.tab.windowId }).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Error abriendo side panel:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Mantener el canal abierto para sendResponse asíncrono
  }

  // El side panel solicita los datos pendientes
  if (request.action === 'getChatData') {
    sendResponse({ data: pendingChatData });
    pendingChatData = null; // Limpiar después de enviar
    return true;
  }
});

// Configurar el side panel para que esté disponible en todas las pestañas
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error configurando side panel:', error));

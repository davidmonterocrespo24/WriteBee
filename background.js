// Background Service Worker para manejar el side panel

// Variable temporal para almacenar datos para el side panel
let pendingChatData = null;

// Create context menus on installation
chrome.runtime.onInstalled.addListener(() => {
  // OCR context menu for images
  chrome.contextMenus.create({
    id: 'ocr-extract-text',
    title: 'Extract Text (OCR)',
    contexts: ['image']
  });

  // Explain image context menu
  chrome.contextMenus.create({
    id: 'explain-image',
    title: 'Explain Image',
    contexts: ['image']
  });

  // Describe image context menu
  chrome.contextMenus.create({
    id: 'describe-image',
    title: 'Describe Image',
    contexts: ['image']
  });

  // Grammar check for selected text
  chrome.contextMenus.create({
    id: 'check-grammar',
    title: 'Check Grammar',
    contexts: ['selection']
  });

  // Chat with page
  chrome.contextMenus.create({
    id: 'chat-with-page',
    title: 'Chat with this Page',
    contexts: ['page']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'ocr-extract-text') {
    // Send message to content script to process OCR
    chrome.tabs.sendMessage(tab.id, {
      action: 'processOCR',
      imageUrl: info.srcUrl
    });
  } else if (info.menuItemId === 'explain-image') {
    // Send message to content script to explain image
    chrome.tabs.sendMessage(tab.id, {
      action: 'explainImage',
      imageUrl: info.srcUrl
    });
  } else if (info.menuItemId === 'describe-image') {
    // Send message to content script to describe image
    chrome.tabs.sendMessage(tab.id, {
      action: 'describeImage',
      imageUrl: info.srcUrl
    });
  } else if (info.menuItemId === 'check-grammar') {
    // Send message to content script to check grammar
    chrome.tabs.sendMessage(tab.id, {
      action: 'checkGrammar',
      text: info.selectionText
    });
  } else if (info.menuItemId === 'chat-with-page') {
    // Open side panel with page context
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Listener para mensajes desde content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSidePanel') {
    console.log('📨 Recibida solicitud de abrir side panel con datos:', request.data);

    // Guardar datos temporalmente
    if (request.data) {
      pendingChatData = request.data;
      console.log('💾 Datos guardados temporalmente:', {
        selectedText: request.data.selectedText?.substring(0, 50) + '...',
        currentAnswer: request.data.currentAnswer?.substring(0, 50) + '...',
        action: request.data.action
      });
    }

    // Abrir el side panel en la pestaña actual
    chrome.sidePanel.open({ windowId: sender.tab.windowId }).then(() => {
      console.log('✅ Side panel abierto correctamente');

      // Enviar datos al side panel después de un pequeño delay
      if (pendingChatData) {
        setTimeout(() => {
          console.log('📤 Enviando datos al side panel automáticamente');
          chrome.runtime.sendMessage({
            action: 'chatData',
            data: pendingChatData
          }).catch(err => {
            console.log('⚠️ Error enviando datos (el panel puede no estar listo aún):', err);
          });
        }, 500); // Dar tiempo al side panel para cargar
      }

      sendResponse({ success: true });
    }).catch((error) => {
      console.error('❌ Error abriendo side panel:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Mantener el canal abierto para sendResponse asíncrono
  }

  // El side panel solicita los datos pendientes
  if (request.action === 'getChatData') {
    console.log('📤 Side panel solicita datos. Datos pendientes:', pendingChatData ? 'Sí' : 'No');
    if (pendingChatData) {
      console.log('📦 Enviando datos al side panel:', {
        selectedText: pendingChatData.selectedText?.substring(0, 50) + '...',
        currentAnswer: pendingChatData.currentAnswer?.substring(0, 50) + '...',
        action: pendingChatData.action
      });
    }
    sendResponse({ data: pendingChatData });
    pendingChatData = null; // Limpiar después de enviar
    return true;
  }
});

// Configurar el side panel para que esté disponible en todas las pestañas
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error configurando side panel:', error));

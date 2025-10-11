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
  
  // PDF Actions - disponible en todas las páginas
  chrome.contextMenus.create({
    id: 'pdf-summarize',
    title: 'Resumir PDF',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'pdf-translate',
    title: 'Traducir PDF',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'pdf-chat',
    title: 'Chat con PDF',
    contexts: ['page']
  });

});

// Interceptar tabs cuando se actualicen para detectar PDFs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Solo procesar cuando la página termine de cargar
  if (changeInfo.status === 'complete' && tab.url) {
    const url = tab.url.toLowerCase();
    
    // Detectar si es un PDF
    const isPDF = url.endsWith('.pdf') || 
                  url.includes('.pdf?') || 
                  url.includes('.pdf#') ||
                  (url.startsWith('chrome-extension://') && url.includes('.pdf'));
    
    if (isPDF) {

      // Intentar inyectar el script manualmente
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['modules/pdf.js']
      }).then(() => {

      }).catch(error => {

        // Si no se puede inyectar, mostrar una notificación al usuario
        chrome.action.setBadgeText({ text: 'PDF', tabId: tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#4285f4', tabId: tabId });
      });
    }
  }
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
    // Request page content from content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'extractPageContentForChat'
    }).then(() => {

    }).catch(error => {
      console.error('❌ Error solicitando contenido:', error);
      // Abrir panel de todas formas
      chrome.sidePanel.open({ windowId: tab.windowId });
    });
  } else if (info.menuItemId === 'pdf-summarize' || 
             info.menuItemId === 'pdf-translate' || 
             info.menuItemId === 'pdf-chat') {
    // Detectar si es un PDF
    const url = tab.url.toLowerCase();
    const isPDF = url.endsWith('.pdf') || 
                  url.includes('.pdf?') || 
                  url.includes('.pdf#') ||
                  (url.startsWith('chrome-extension://') && url.includes('.pdf'));
    
    if (isPDF) {

      // Abrir side panel con la acción específica
      pendingChatData = {
        pdfMode: true,
        pdfUrl: tab.url,
        pdfAction: info.menuItemId.replace('pdf-', '')
      };
      
      chrome.sidePanel.open({ windowId: tab.windowId });
    } else {
      // Notificar al usuario que no es un PDF
      chrome.tabs.sendMessage(tab.id, {
        action: 'showNotification',
        message: 'Esta página no es un PDF. Abre un archivo PDF para usar estas funciones.'
      }).catch(() => {

      });
    }
  }
});

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
      console.error('❌ Error abriendo side panel:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Mantener el canal abierto para sendResponse asíncrono
  }

  // Mensaje chatData desde content script (por ejemplo, desde floatButtons)
  if (request.action === 'chatData') {


      
    
    // Guardar los datos para que el side panel los pueda solicitar
    pendingChatData = request.data;
    
    // Intentar enviar directamente al side panel si está abierto
    chrome.runtime.sendMessage({
      action: 'chatData',
      data: request.data
    }).then(() => {

      sendResponse({ success: true });
    }).catch((error) => {

      // Los datos quedan en pendingChatData para que el side panel los solicite
      sendResponse({ success: true, pending: true });
    });
    
    return true;
  }

  // El side panel solicita los datos pendientes
  if (request.action === 'getChatData') {

    if (pendingChatData) {

       
    }
    sendResponse({ data: pendingChatData });
    pendingChatData = null; // Limpiar después de enviar
    return true;
  }
  
  // Mensaje desde el badge cuando se hace clic en extensión con PDF
  if (request.action === 'pdfToolbarRequest') {

    // Abrir side panel con modo PDF
    chrome.sidePanel.open({ windowId: sender.tab.windowId }).then(() => {
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'chatData',
          data: { pdfMode: true, pdfUrl: request.pdfUrl }
        }).catch(err => console.log('⚠️ Error:', err));
      }, 500);
      sendResponse({ success: true });
    }).catch(error => {
      console.error('❌ Error:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

// Configurar el side panel para que esté disponible en todas las pestañas
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error('Error configurando side panel:', error));



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

  // Generate text in textarea
  chrome.contextMenus.create({
    id: 'generate-text',
    title: 'Generate Text',
    contexts: ['editable']
  });

  // Chat with page
  chrome.contextMenus.create({
    id: 'chat-with-page',
    title: 'Chat with this Page',
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
  } else if (info.menuItemId === 'generate-text') {
    // Send message to content script to generate text
    chrome.tabs.sendMessage(tab.id, {
      action: 'generateText',
      editableInfo: info.editable
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
  }
});

// Listener para mensajes desde content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle YouTube transcript API requests (bypass CORS)
  if (request.action === 'fetchYoutubeTranscript') {
    const API_ENDPOINT = 'https://www.youtranscripts.com/api/transcript/';

    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: request.videoUrl })
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('Error fetching transcript:', error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep channel open for async response
  }

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

  // Request microphone permission via content script overlay
  if (request.type === 'request-microphone-permission') {
    console.log('BACKGROUND: Requesting microphone permission via content script');

    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        // Send message to content script to show permission overlay
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'showMicrophonePermission'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error showing permission overlay:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });

    return true; // Keep channel open for async response
  }

  // Start recording in page context
  if (request.type === 'start-recording-in-page') {
    console.log('BACKGROUND: Starting recording in page context');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'startRecordingInPage'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error starting recording:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });

    return true;
  }

  // Stop recording in page context
  if (request.type === 'stop-recording-in-page') {
    console.log('BACKGROUND: Stopping recording in page context');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'stopRecordingInPage'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error stopping recording:', chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse(response);
          }
        });
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });

    return true;
  }

  // Audio recorded from page - forward to side panel
  if (request.type === 'audio-recorded-from-page') {
    console.log('BACKGROUND: Audio recorded from page, forwarding to side panel');
    console.log('BACKGROUND: Audio data size:', request.audioData ? request.audioData.length : 0, 'bytes');

    // Forward the audio data to side panel
    chrome.runtime.sendMessage({
      type: 'transcribe-audio',
      audioData: request.audioData,
      mimeType: request.mimeType || 'audio/webm'
    });
    sendResponse({ success: true });
    return true;
  }

  // Audio recording using offscreen document
  if (request.type === 'start-recording' || request.type === 'stop-recording') {
    forwardToOffscreen(request);
    sendResponse({ success: true });
    return true;
  }

  if (request.type === 'recording-started') {
    console.log('BACKGROUND: Recording started successfully');
    chrome.runtime.sendMessage({ type: 'recording-started' });
    sendResponse({ success: true });
    return true;
  }

  if (request.type === 'audio-recorded') {
    console.log('BACKGROUND: Received audio-recorded, forwarding to side panel');
    closeOffscreenDocument();
    // Forward the audio to the side panel
    chrome.runtime.sendMessage({ type: 'transcribe-audio', data: request.data });
    sendResponse({ success: true });
    return true;
  }

  if (request.type === 'recording-error') {
    console.log('BACKGROUND: Recording error received', request.error);
    closeOffscreenDocument();
    chrome.runtime.sendMessage({ type: 'recording-error', error: request.error });
    sendResponse({ success: true });
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

let creating;
async function forwardToOffscreen(request) {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length > 0) {
    chrome.runtime.sendMessage({ ...request, target: 'offscreen' });
    return;
  }

  if (creating) {
    await creating;
  } else {
    creating = chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA'],
      justification: 'Audio recording for transcription'
    });
    await creating;
    creating = null;
  }

  chrome.runtime.sendMessage({ ...request, target: 'offscreen' });
}

async function closeOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (existingContexts.length > 0) {
    chrome.offscreen.closeDocument();
  }
}



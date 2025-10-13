let ignoreNextMouseUp = false;

document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('mousedown', handleClickOutside);

function handleTextSelection(e) {

  if (ignoreNextMouseUp) {

    ignoreNextMouseUp = false;
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    const allDialogs = document.querySelectorAll('.ai-result-panel, .ai-twitter-dialog, .ai-linkedin-dialog');
    let isInsideDialog = false;
    allDialogs.forEach(dialog => {
      if (dialog.contains(e.target)) {
        isInsideDialog = true;
      }
    });

    const menu = MenusModule.getMenu();
    const toolbar = ToolbarModule.getToolbar();
    const isInsideMenu = menu && menu.contains(e.target);
    const isInsideToolbar = toolbar && toolbar.contains(e.target);


    const isTwitterButton = e.target.closest('.ai-twitter-btn-tweet, .ai-twitter-btn-reply');
    const isLinkedInButton = e.target.closest('.ai-linkedin-btn-post, .ai-linkedin-btn-comment');
    const isFloatButton = e.target.closest('.ai-float-btn-container, .ai-float-btn');



    if (isInsideDialog || isInsideMenu || isInsideToolbar || isTwitterButton || isLinkedInButton || isFloatButton) {

      return;
    }

    if (text.length > 0) {

      ToolbarModule.showToolbar(e.pageX, e.pageY, e.clientX, e.clientY, text);
    } else {

      hideAll();
    }
  }, 10);
}

function setIgnoreNextMouseUp() {
  ignoreNextMouseUp = true;
}

window.setIgnoreNextMouseUp = setIgnoreNextMouseUp;

function handleClickOutside(e) {
  const toolbar = ToolbarModule.getToolbar();
  const menu = MenusModule.getMenu();
  const translateMenu = MenusModule.getTranslateMenu();

  const allDialogs = document.querySelectorAll('.ai-result-panel, .ai-twitter-dialog, .ai-linkedin-dialog');
  let clickedInsideDialog = false;
  allDialogs.forEach(dialog => {
    if (dialog.contains(e.target)) {
      clickedInsideDialog = true;
    }
  });

  const isTwitterButton = e.target.closest('.ai-twitter-btn-tweet, .ai-twitter-btn-reply');
  const isLinkedInButton = e.target.closest('.ai-linkedin-btn-post, .ai-linkedin-btn-comment');
  const isFloatButton = e.target.closest('.ai-float-btn-container, .ai-float-btn');

  if (clickedInsideDialog || isTwitterButton || isLinkedInButton || isFloatButton) {
    return;
  }

  if ((!toolbar || !toolbar.contains(e.target)) &&
      (!menu || !menu.contains(e.target)) &&
      (!translateMenu || !translateMenu.contains(e.target))) {
    hideAll();
  }
}

function hideAll() {

  ToolbarModule.hideToolbar();
  MenusModule.hideMenus();
  const currentDialog = DialogModule.getCurrentDialog();
  if (currentDialog) {

    currentDialog.remove();
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'processOCR') {
    // Process OCR on image
    handleOCRRequest(request.imageUrl);
    sendResponse({ success: true });
  } else if (request.action === 'explainImage') {
    // Explain image
    handleExplainImage(request.imageUrl);
    sendResponse({ success: true });
  } else if (request.action === 'describeImage') {
    // Describe image
    handleDescribeImage(request.imageUrl);
    sendResponse({ success: true });
  } else if (request.action === 'extractPageContentForChat') {
    // Extract page content and send to side panel
    handleExtractPageContent();
    sendResponse({ success: true });
  } else if (request.action === 'showMicrophonePermission') {
    // Show microphone permission overlay
    handleShowMicrophonePermission(sendResponse);
    return true; // Keep channel open for async response
  } else if (request.action === 'startRecordingInPage') {
    // Start recording in page context
    handleStartRecordingInPage(sendResponse);
    return true;
  } else if (request.action === 'stopRecordingInPage') {
    // Stop recording in page context
    handleStopRecordingInPage(sendResponse);
    return true;
  }
  return true;
});

// Handle microphone permission request
async function handleShowMicrophonePermission(sendResponse) {
  try {
    if (typeof MicrophonePermissionModule === 'undefined') {
      sendResponse({ success: false, error: 'MicrophonePermissionModule not loaded' });
      return;
    }

    const granted = await MicrophonePermissionModule.requestPermission();
    sendResponse({ success: true, granted: granted });
  } catch (error) {
    console.error('Error showing microphone permission:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle start recording request
async function handleStartRecordingInPage(sendResponse) {
  try {
    if (typeof MicrophonePermissionModule === 'undefined') {
      sendResponse({ success: false, error: 'MicrophonePermissionModule not loaded' });
      return;
    }

    const result = await MicrophonePermissionModule.startRecording();
    sendResponse(result);
  } catch (error) {
    console.error('Error starting recording:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle stop recording request
function handleStopRecordingInPage(sendResponse) {
  try {
    if (typeof MicrophonePermissionModule === 'undefined') {
      sendResponse({ success: false, error: 'MicrophonePermissionModule not loaded' });
      return;
    }

    const result = MicrophonePermissionModule.stopRecording();
    sendResponse(result);
  } catch (error) {
    console.error('Error stopping recording:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Handle OCR request
async function handleOCRRequest(imageUrl) {
  try {
    const imageData = {
      imageMode: true,
      imageUrl: imageUrl,
      imageAction: 'ocr',
      prompt: 'Extract all visible text from this image. Return ONLY the extracted text, nothing else. If there\'s no text, say \'No text found\'.'
    };

    // Always open side panel with the data
    chrome.runtime.sendMessage({
      action: 'openSidePanel',
      data: imageData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error opening side panel:', chrome.runtime.lastError);
        return;
      }
      
      // Also try to send to side panel directly (in case it was already open)
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'chatData',
          data: imageData
        }).catch(() => {
          // Ignore errors - this is just a backup
        });
      }, 300);
    });
  } catch (error) {
    console.error('Error processing OCR:', error);
    alert('Error extracting text: ' + error.message);
  }
}

// Handle explain image request
async function handleExplainImage(imageUrl) {
  try {
    const imageData = {
      imageMode: true,
      imageUrl: imageUrl,
      imageAction: 'explain',
      prompt: 'Explain what is happening in this image in detail.'
    };

    // Always open side panel with the data
    chrome.runtime.sendMessage({
      action: 'openSidePanel',
      data: imageData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error opening side panel:', chrome.runtime.lastError);
        return;
      }
      
      // Also try to send to side panel directly (in case it was already open)
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'chatData',
          data: imageData
        }).catch(() => {
          // Ignore errors - this is just a backup
        });
      }, 300);
    });
  } catch (error) {
    console.error('Error explaining image:', error);
    alert('Error explaining image: ' + error.message);
  }
}

// Handle describe image request
async function handleDescribeImage(imageUrl) {
  try {
    const imageData = {
      imageMode: true,
      imageUrl: imageUrl,
      imageAction: 'describe',
      prompt: 'Describe this image in detail.'
    };

    // Always open side panel with the data
    chrome.runtime.sendMessage({
      action: 'openSidePanel',
      data: imageData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error opening side panel:', chrome.runtime.lastError);
        return;
      }
      
      // Also try to send to side panel directly (in case it was already open)
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'chatData',
          data: imageData
        }).catch(() => {
          // Ignore errors - this is just a backup
        });
      }, 300);
    });
  } catch (error) {
    console.error('Error describing image:', error);
    alert('Error describing image: ' + error.message);
  }
}

// Handle extract page content for chat (from context menu)
async function handleExtractPageContent() {
  try {

    const pageContent = WebChatModule.extractPageContent();
    const metadata = WebChatModule.getPageMetadata();


     

    const pageData = {
      context: 'page-chat',
      webChatMode: true,
      pageTitle: metadata.title,
      pageUrl: metadata.url,
      pageContent: pageContent.substring(0, 50000) // Increased from 10k to 50k for better context
    };

    // Always open side panel with the data
    chrome.runtime.sendMessage({
      action: 'openSidePanel',
      data: pageData
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error opening side panel:', chrome.runtime.lastError);
        return;
      }
      
      // Also try to send to side panel directly (in case it was already open)
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'chatData',
          data: pageData
        }).catch(() => {
          // Ignore errors - this is just a backup
        });
      }, 300);
    });
  } catch (error) {
    console.error('❌ Error extrayendo contenido de página:', error);
  }
}



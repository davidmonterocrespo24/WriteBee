let ignoreNextMouseUp = false;

document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('mousedown', handleClickOutside);

function handleTextSelection(e) {
  console.log('🔵 handleTextSelection - ignoreNextMouseUp:', ignoreNextMouseUp);

  if (ignoreNextMouseUp) {
    console.log('✅ Ignoring mouseup');
    ignoreNextMouseUp = false;
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    console.log('📝 Selected text:', text);

    const allDialogs = document.querySelectorAll('.ai-result-panel, .ai-twitter-dialog, .ai-linkedin-dialog');
    let isInsideDialog = false;
    allDialogs.forEach(dialog => {
      if (dialog.contains(e.target)) {
        isInsideDialog = true;
      }
    });

    console.log('📦 Dialogs found:', allDialogs.length, '- Click inside:', isInsideDialog);

    const menu = MenusModule.getMenu();
    const toolbar = ToolbarModule.getToolbar();
    const isInsideMenu = menu && menu.contains(e.target);
    const isInsideToolbar = toolbar && toolbar.contains(e.target);

    console.log('🔧 Menu exists:', !!menu, '- Click inside:', isInsideMenu);
    console.log('🔧 Toolbar exists:', !!toolbar, '- Click inside:', isInsideToolbar);

    const isTwitterButton = e.target.closest('.ai-twitter-btn-tweet, .ai-twitter-btn-reply');
    const isLinkedInButton = e.target.closest('.ai-linkedin-btn-post, .ai-linkedin-btn-comment');

    console.log('🐦 Click on Twitter button:', !!isTwitterButton);
    console.log('💼 Click on LinkedIn button:', !!isLinkedInButton);

    if (isInsideDialog || isInsideMenu || isInsideToolbar || isTwitterButton || isLinkedInButton) {
      console.log('⏸️ Exiting - click inside UI or module button');
      return;
    }

    if (text.length > 0) {
      console.log('✨ Showing toolbar');
      ToolbarModule.showToolbar(e.pageX, e.pageY, e.clientX, e.clientY, text);
    } else {
      console.log('❌ Hiding all');
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

  if (clickedInsideDialog || isTwitterButton || isLinkedInButton) {
    return;
  }

  if ((!toolbar || !toolbar.contains(e.target)) &&
      (!menu || !menu.contains(e.target)) &&
      (!translateMenu || !translateMenu.contains(e.target))) {
    hideAll();
  }
}

function hideAll() {
  console.log('🗑️ hideAll - hiding toolbar, menus and current dialog');
  ToolbarModule.hideToolbar();
  MenusModule.hideMenus();
  const currentDialog = DialogModule.getCurrentDialog();
  if (currentDialog) {
    console.log('🗑️ Removing current dialog');
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
  } else if (request.action === 'checkGrammar') {
    // Check grammar on selected text
    handleGrammarCheck(request.text);
    sendResponse({ success: true });
  }
  return true;
});

// Handle OCR request
async function handleOCRRequest(imageUrl) {
  try {
    // Open side panel with OCR request
    chrome.runtime.sendMessage({
      action: 'openSidePanel',
      data: {
        imageMode: true,
        imageUrl: imageUrl,
        imageAction: 'ocr',
        prompt: 'Extract all visible text from this image. Return ONLY the extracted text, nothing else. If there\'s no text, say \'No text found\'.'
      }
    });
  } catch (error) {
    console.error('Error processing OCR:', error);
    alert('Error extracting text: ' + error.message);
  }
}

// Handle explain image request
async function handleExplainImage(imageUrl) {
  try {
    // Open side panel with explain request
    chrome.runtime.sendMessage({
      action: 'openSidePanel',
      data: {
        imageMode: true,
        imageUrl: imageUrl,
        imageAction: 'explain',
        prompt: 'Explain what is happening in this image in detail.'
      }
    });
  } catch (error) {
    console.error('Error explaining image:', error);
    alert('Error explaining image: ' + error.message);
  }
}

// Handle describe image request
async function handleDescribeImage(imageUrl) {
  try {
    // Open side panel with describe request
    chrome.runtime.sendMessage({
      action: 'openSidePanel',
      data: {
        imageMode: true,
        imageUrl: imageUrl,
        imageAction: 'describe',
        prompt: 'Describe this image in detail.'
      }
    });
  } catch (error) {
    console.error('Error describing image:', error);
    alert('Error describing image: ' + error.message);
  }
}

// Handle grammar check request
async function handleGrammarCheck(text) {
  try {
    // Create a temporary dialog with grammar check
    const loadingDialog = DialogModule.showLoadingDialog(null);
    loadingDialog.querySelector('.ai-loading').textContent = 'Checking grammar...';
    document.body.appendChild(loadingDialog);

    const result = await AIModule.aiGrammar(text);

    loadingDialog.remove();

    const grammarDialog = DialogModule.createDialog('grammar', result, text, null);
    document.body.appendChild(grammarDialog);
    grammarDialog.adjustPosition?.();
  } catch (error) {
    console.error('Error checking grammar:', error);
    alert('Error checking grammar: ' + error.message);
  }
}

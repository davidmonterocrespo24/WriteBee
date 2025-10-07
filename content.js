let ignoreNextMouseUp = false;

document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('mousedown', handleClickOutside);

function handleTextSelection(e) {
  console.log('🔵 handleTextSelection - ignoreNextMouseUp:', ignoreNextMouseUp);

  // Si se activó la bandera de ignorar, resetearla y salir
  if (ignoreNextMouseUp) {
    console.log('✅ Ignorando mouseup');
    ignoreNextMouseUp = false;
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    console.log('📝 Texto seleccionado:', text);

    // Verificar si la selección está dentro de un diálogo (incluyendo módulos específicos)
    const allDialogs = document.querySelectorAll('.ai-result-panel, .ai-twitter-dialog, .ai-linkedin-dialog');
    let isInsideDialog = false;
    allDialogs.forEach(dialog => {
      if (dialog.contains(e.target)) {
        isInsideDialog = true;
      }
    });

    console.log('📦 Diálogos encontrados:', allDialogs.length, '- Click dentro:', isInsideDialog);

    // Verificar si el click fue en el menú o toolbar
    const menu = MenusModule.getMenu();
    const toolbar = ToolbarModule.getToolbar();
    const isInsideMenu = menu && menu.contains(e.target);
    const isInsideToolbar = toolbar && toolbar.contains(e.target);

    console.log('🔧 Menu existe:', !!menu, '- Click dentro:', isInsideMenu);
    console.log('🔧 Toolbar existe:', !!toolbar, '- Click dentro:', isInsideToolbar);

    // Verificar si el click fue en un botón de Twitter o LinkedIn
    const isTwitterButton = e.target.closest('.ai-twitter-btn-tweet, .ai-twitter-btn-reply');
    const isLinkedInButton = e.target.closest('.ai-linkedin-btn-post, .ai-linkedin-btn-comment');

    console.log('🐦 Click en botón Twitter:', !!isTwitterButton);
    console.log('💼 Click en botón LinkedIn:', !!isLinkedInButton);

    // Si la selección está dentro de un diálogo, menú, toolbar o botón de módulo, no hacer nada
    if (isInsideDialog || isInsideMenu || isInsideToolbar || isTwitterButton || isLinkedInButton) {
      console.log('⏸️ Saliendo - click dentro de UI o botón de módulo');
      return;
    }

    if (text.length > 0) {
      console.log('✨ Mostrando toolbar');
      // Pasar pageX/pageY para posición absoluta y clientX/clientY para posición en viewport
      ToolbarModule.showToolbar(e.pageX, e.pageY, e.clientX, e.clientY, text);
    } else {
      console.log('❌ Ocultando todo');
      hideAll();
    }
  }, 10);
}

function setIgnoreNextMouseUp() {
  ignoreNextMouseUp = true;
}

// Exponer función globalmente para que los módulos puedan usarla
window.setIgnoreNextMouseUp = setIgnoreNextMouseUp;

function handleClickOutside(e) {
  const toolbar = ToolbarModule.getToolbar();
  const menu = MenusModule.getMenu();
  const translateMenu = MenusModule.getTranslateMenu();

  // Verificar si el click fue en algún diálogo (incluyendo módulos específicos)
  const allDialogs = document.querySelectorAll('.ai-result-panel, .ai-twitter-dialog, .ai-linkedin-dialog');
  let clickedInsideDialog = false;
  allDialogs.forEach(dialog => {
    if (dialog.contains(e.target)) {
      clickedInsideDialog = true;
    }
  });

  // Verificar si el click fue en un botón de Twitter o LinkedIn
  const isTwitterButton = e.target.closest('.ai-twitter-btn-tweet, .ai-twitter-btn-reply');
  const isLinkedInButton = e.target.closest('.ai-linkedin-btn-post, .ai-linkedin-btn-comment');

  // Si el click fue dentro de algún diálogo o en un botón de módulo, no hacer nada
  if (clickedInsideDialog || isTwitterButton || isLinkedInButton) {
    return;
  }

  // Si el click fue fuera de toolbar, menús y diálogos, ocultar todo
  if ((!toolbar || !toolbar.contains(e.target)) &&
      (!menu || !menu.contains(e.target)) &&
      (!translateMenu || !translateMenu.contains(e.target))) {
    hideAll();
  }
}

function hideAll() {
  console.log('🗑️ hideAll - ocultando toolbar, menús y diálogo actual');
  ToolbarModule.hideToolbar();
  MenusModule.hideMenus();
  const currentDialog = DialogModule.getCurrentDialog();
  if (currentDialog) {
    console.log('🗑️ Eliminando diálogo actual');
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
    // Create image element from URL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // Process OCR
    await OCRModule.processImageOCR(img);
  } catch (error) {
    console.error('Error processing OCR:', error);
    alert('Error extracting text: ' + error.message);
  }
}

// Handle explain image request
async function handleExplainImage(imageUrl) {
  try {
    // Create image element from URL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // Show loading dialog
    const loadingDialog = DialogModule.showLoadingDialog(null);
    loadingDialog.querySelector('.ai-loading').textContent = 'Explaining image...';
    document.body.appendChild(loadingDialog);

    // Convert image to blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Explain image
    const explanation = await MultimodalModule.processImageWithAction(blob, 'explain', '', (progress) => {
      // Update progress if needed
    });

    loadingDialog.remove();

    // Create dialog with explanation
    const dialog = DialogModule.createImageDialog(blob, 'explain', null);
    const answerDiv = dialog.querySelector('.ai-answer');
    answerDiv.textContent = explanation;
    document.body.appendChild(dialog);
  } catch (error) {
    console.error('Error explaining image:', error);
    alert('Error explaining image: ' + error.message);
  }
}

// Handle describe image request
async function handleDescribeImage(imageUrl) {
  try {
    // Create image element from URL
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // Show loading dialog
    const loadingDialog = DialogModule.showLoadingDialog(null);
    loadingDialog.querySelector('.ai-loading').textContent = 'Describing image...';
    document.body.appendChild(loadingDialog);

    // Convert image to blob
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // Describe image
    const description = await MultimodalModule.describeImage(blob, 'Describe this image in detail.', (progress) => {
      // Update progress if needed
    });

    loadingDialog.remove();

    // Create dialog with description
    const dialog = DialogModule.createImageDialog(blob, 'describe', null);
    const answerDiv = dialog.querySelector('.ai-answer');
    answerDiv.textContent = description;
    document.body.appendChild(dialog);
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

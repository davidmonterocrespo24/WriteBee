const OCRModule = (function() {
  let lastImageElement = null;

  /**
   * Extract text from image using Chrome Multimodal API
   */
  async function extractTextFromImage(imageFile, onProgress = null) {
    try {
      const prompt = "Extract all visible text from this image. Return ONLY the extracted text, nothing else. If there's no text, say 'No text found'.";

      if (onProgress) {
        return await MultimodalModule.describeImage(imageFile, prompt, onProgress);
      } else {
        return await MultimodalModule.describeImage(imageFile, prompt);
      }
    } catch (error) {
      throw new Error('OCR Error: ' + error.message);
    }
  }

  /**
   * Create OCR dialog to show extracted text
   */
  function createOCRDialog(imageUrl, extractedText, imageElement) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-ocr-dialog';
    dialog.dataset.pinned = 'true';

    // Position dialog near the image
    const rect = imageElement.getBoundingClientRect();
    dialog.style.left = (rect.left + window.scrollX) + 'px';
    dialog.style.top = (rect.bottom + window.scrollY + 10) + 'px';

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="title">🔤 OCR - Text Extraction</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn pin-btn" aria-label="Pin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 3l5 5-7 7-4 1 1-4 7-7zM2 22l6-6"/>
          </svg>
        </button>
        <button class="ai-iconbtn close-panel" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        <div class="ai-image-preview" style="margin-bottom: 1rem; text-align: center;">
          <img src="${imageUrl}" alt="OCR Image" style="max-width: 100%; max-height: 200px; border-radius: 8px;" />
        </div>
        <div class="ai-ocr-text" style="background: #1f1f23; padding: 12px; border-radius: 6px; min-height: 100px; max-height: 300px; overflow-y: auto; white-space: pre-wrap; font-family: monospace;">${extractedText}</div>
      </div>

      <div class="ai-actions">
        <div class="left">Extracted Text</div>
        <div class="right">
          <button class="ai-iconbtn copy-btn" aria-label="Copy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
          </button>
          <button class="ai-iconbtn summarize-ocr-btn" aria-label="Summarize" title="Summarize text">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="9" y1="13" x2="15" y2="13"/>
              <line x1="9" y1="17" x2="15" y2="17"/>
            </svg>
          </button>
          <button class="ai-iconbtn translate-ocr-btn" aria-label="Translate" title="Translate text">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14.5 17h6"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    DialogModule.enableDrag(dialog);
    setupOCRDialogEvents(dialog, extractedText);

    return dialog;
  }

  /**
   * Setup events for OCR dialog
   */
  function setupOCRDialogEvents(dialog, extractedText) {
    // Close button
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });

    // Pin button
    const pinBtn = dialog.querySelector('.pin-btn');
    pinBtn.addEventListener('click', () => {
      if (dialog.dataset.pinned === 'false') {
        dialog.dataset.pinned = 'true';
        pinBtn.style.color = '#ffd400';
      } else {
        dialog.dataset.pinned = 'false';
        pinBtn.style.color = '';
      }
    });

    // Copy button
    const copyBtn = dialog.querySelector('.copy-btn');
    copyBtn.addEventListener('click', () => {
      const textDiv = dialog.querySelector('.ai-ocr-text');
      navigator.clipboard.writeText(textDiv.textContent);

      const originalHTML = copyBtn.innerHTML;
      copyBtn.innerHTML = '<span style="font-size: 0.9rem;">✓</span>';
      setTimeout(() => {
        copyBtn.innerHTML = originalHTML;
      }, 2000);
    });

    // Summarize button
    const summarizeBtn = dialog.querySelector('.summarize-ocr-btn');
    summarizeBtn?.addEventListener('click', async () => {
      try {
        summarizeBtn.disabled = true;
        const result = await AIModule.aiSummarize(extractedText);

        // Create new dialog with summary
        const summaryDialog = DialogModule.createDialog('summarize', result, extractedText, null);
        document.body.appendChild(summaryDialog);
        summaryDialog.adjustPosition?.();
      } catch (error) {
        alert('Error summarizing: ' + error.message);
      } finally {
        summarizeBtn.disabled = false;
      }
    });

    // Translate button
    const translateBtn = dialog.querySelector('.translate-ocr-btn');
    translateBtn?.addEventListener('click', async () => {
      try {
        translateBtn.disabled = true;
        const result = await AIModule.aiTranslate(extractedText, 'en');

        // Create new dialog with translation
        const translateDialog = DialogModule.createDialog('translate', result, extractedText, null);
        document.body.appendChild(translateDialog);
        translateDialog.adjustPosition?.();
      } catch (error) {
        alert('Error translating: ' + error.message);
      } finally {
        translateBtn.disabled = false;
      }
    });
  }

  /**
   * Handle image right-click for OCR
   */
  function handleImageContextMenu(event) {
    const img = event.target;

    if (img.tagName === 'IMG') {
      lastImageElement = img;
    }
  }

  /**
   * Process image for OCR
   */
  async function processImageOCR(imageElement) {
    try {
      // Show loading dialog
      const loadingDialog = DialogModule.showLoadingDialog(null);
      loadingDialog.querySelector('.ai-loading').textContent = 'Extracting text from image...';
      document.body.appendChild(loadingDialog);

      // Convert image to blob
      const response = await fetch(imageElement.src);
      const blob = await response.blob();

      // Extract text
      let extractedText = '';
      const result = await extractTextFromImage(blob, (progress) => {
        extractedText = progress;
      });

      // Remove loading dialog
      loadingDialog.remove();

      // Show OCR dialog
      const ocrDialog = createOCRDialog(imageElement.src, extractedText, imageElement);
      document.body.appendChild(ocrDialog);

      return extractedText;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize OCR module
   */
  function init() {
    // Listen for image context menu
    document.addEventListener('contextmenu', handleImageContextMenu, true);
  }

  return {
    extractTextFromImage,
    createOCRDialog,
    processImageOCR,
    init,
    getLastImageElement: () => lastImageElement
  };
})();

// Initialize
if (typeof window !== 'undefined') {
  window.OCRModule = OCRModule;
  OCRModule.init();
}



// Creado por David Montero Crespo para WriteBee

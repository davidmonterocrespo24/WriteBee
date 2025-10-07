const PDFModule = (function() {
  let currentPDF = null;

  /**
   * Check if current page is a PDF
   */
  function isPDFPage() {
    return document.contentType === 'application/pdf' ||
           window.location.pathname.endsWith('.pdf') ||
           document.querySelector('embed[type="application/pdf"]') !== null;
  }

  /**
   * Extract text from PDF using Chrome's built-in PDF viewer
   */
  async function extractPDFText() {
    try {
      // Try to get text from PDF viewer
      const embedEl = document.querySelector('embed[type="application/pdf"]');
      if (embedEl) {
        // For embedded PDFs, we need to access via iframe or fetch
        const response = await fetch(embedEl.src);
        const blob = await response.blob();
        return await extractTextFromBlob(blob);
      }

      // For direct PDF URLs, get the document text
      const response = await fetch(window.location.href);
      const blob = await response.blob();
      return await extractTextFromBlob(blob);
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Could not extract text from PDF');
    }
  }

  /**
   * Extract text from PDF blob using multimodal API (OCR approach)
   */
  async function extractTextFromBlob(blob) {
    // Note: Chrome's multimodal API can process PDF pages as images
    // We'll need to convert PDF to images first
    const text = await convertPDFToTextViaOCR(blob);
    return text;
  }

  /**
   * Convert PDF to text via OCR (using multimodal API on each page)
   */
  async function convertPDFToTextViaOCR(pdfBlob) {
    // This is a simplified version - in production you'd use a proper PDF library
    // For now, we'll use the AI to extract text from the PDF directly
    return "PDF text extraction placeholder - implement with proper PDF library";
  }

  /**
   * Translate PDF
   */
  async function translatePDF(targetLanguage = 'en', onProgress = null) {
    try {
      if (onProgress) onProgress('Extracting text from PDF...');

      const text = await extractPDFText();

      if (onProgress) onProgress('Translating PDF content...');

      const translatedText = await AIModule.aiTranslate(text, targetLanguage);

      // Show result in dialog
      const dialog = DialogModule.createDialog('translate', translatedText, text, null);
      document.body.appendChild(dialog);

      return translatedText;
    } catch (error) {
      throw new Error('PDF translation error: ' + error.message);
    }
  }

  /**
   * Summarize PDF
   */
  async function summarizePDF(onProgress = null) {
    try {
      if (onProgress) onProgress('Extracting text from PDF...');

      const text = await extractPDFText();

      if (onProgress) onProgress('Summarizing PDF content...');

      const summary = await AIModule.aiSummarize(text);

      // Show result in dialog
      const dialog = DialogModule.createDialog('summarize', summary, text.substring(0, 500) + '...', null);
      document.body.appendChild(dialog);

      return summary;
    } catch (error) {
      throw new Error('PDF summarization error: ' + error.message);
    }
  }

  /**
   * Chat with PDF
   */
  async function chatWithPDF(question, onProgress = null) {
    try {
      if (!currentPDF) {
        if (onProgress) onProgress('Loading PDF content...');
        currentPDF = await extractPDFText();
      }

      if (onProgress) onProgress('Processing your question...');

      const context = `Based on this PDF content:\n\n${currentPDF}\n\nQuestion: ${question}`;
      const answer = await AIModule.aiPrompt(context);

      return answer;
    } catch (error) {
      throw new Error('PDF chat error: ' + error.message);
    }
  }

  /**
   * Create PDF toolbar
   */
  function createPDFToolbar() {
    if (document.querySelector('.ai-pdf-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.className = 'ai-pdf-toolbar';
    toolbar.innerHTML = `
      <button class="ai-pdf-btn" data-action="summarize" title="Summarize PDF">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="13" x2="15" y2="13"/>
          <line x1="9" y1="17" x2="15" y2="17"/>
        </svg>
        Summarize
      </button>
      <button class="ai-pdf-btn" data-action="translate" title="Translate PDF">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14.5 17h6"/>
        </svg>
        Translate
      </button>
      <button class="ai-pdf-btn" data-action="chat" title="Chat with PDF">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Chat
      </button>
      <button class="ai-pdf-btn" data-action="ocr" title="Extract Text (OCR)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="7" y1="10" x2="17" y2="10"/>
          <line x1="7" y1="14" x2="17" y2="14"/>
        </svg>
        OCR
      </button>
    `;

    document.body.appendChild(toolbar);

    // Setup event listeners
    toolbar.querySelectorAll('.ai-pdf-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;

        const loadingDialog = DialogModule.showLoadingDialog(null);
        document.body.appendChild(loadingDialog);

        try {
          switch (action) {
            case 'summarize':
              await summarizePDF((msg) => {
                loadingDialog.querySelector('.ai-loading').textContent = msg;
              });
              break;
            case 'translate':
              await translatePDF('en', (msg) => {
                loadingDialog.querySelector('.ai-loading').textContent = msg;
              });
              break;
            case 'chat':
              loadingDialog.remove();
              // Open side panel for chat
              chrome.runtime.sendMessage({
                action: 'openSidePanel',
                data: {
                  pdfMode: true,
                  pdfContent: currentPDF || await extractPDFText()
                }
              });
              return;
            case 'ocr':
              const text = await extractPDFText();
              loadingDialog.remove();
              const ocrDialog = DialogModule.createDialog('answer', text, 'PDF OCR', null);
              document.body.appendChild(ocrDialog);
              return;
          }

          loadingDialog.remove();
        } catch (error) {
          loadingDialog.remove();
          alert('Error: ' + error.message);
        }
      });
    });
  }

  /**
   * Initialize PDF module
   */
  function init() {
    if (isPDFPage()) {
      createPDFToolbar();
    }
  }

  return {
    isPDFPage,
    extractPDFText,
    translatePDF,
    summarizePDF,
    chatWithPDF,
    createPDFToolbar,
    init
  };
})();

// Initialize if on PDF page
if (typeof window !== 'undefined') {
  window.PDFModule = PDFModule;

  // Check if page is PDF and initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      PDFModule.init();
    });
  } else {
    PDFModule.init();
  }
}

const PDFModule = (function() {

  let currentPDF = null;

  /**
   * Check if current page is a PDF
   */
  function isPDFPage() {
    // 1. Detect by URL - the most reliable method
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const isPDFUrl = pathname.endsWith('.pdf') || url.includes('.pdf');
    
    // 2. Detect local PDF (file://)
    const isLocalPDF = window.location.protocol === 'file:' && isPDFUrl;
    
    // 3. Detect Chrome Extension PDF viewer
    // The URL will be something like: chrome-extension://xxxxx/file:///C:/path/to/file.pdf
    const isChromeExtensionPDF = window.location.protocol === 'chrome-extension:' && 
                                 (url.includes('file:///') || url.includes('.pdf'));
    
    // 4. Detect by document content type
    const isPDFContentType = document.contentType === 'application/pdf';
    
    // 5. Detect embedded PDF viewer in Chrome
    const hasEmbedPDF = document.querySelector('embed[type="application/pdf"]') !== null;
    
    // 6. Detect PDF iframe
    const hasPDFIframe = document.querySelector('iframe[src*=".pdf"]') !== null;
    
    // 7. Chrome sometimes uses an <embed> as the root element
    const isRootEmbed = document.documentElement.tagName === 'EMBED';
    
    // 8. Detect PDF.js viewer by URL params
    const hasPDFParam = url.includes('viewer.html?file=') || url.includes('/pdfjs/');
    
    const result = isPDFUrl || isLocalPDF || isChromeExtensionPDF || isPDFContentType || 
                   hasEmbedPDF || hasPDFIframe || isRootEmbed || hasPDFParam;
    

      
    
    return result;
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

    if (document.querySelector('.ai-pdf-toolbar')) {

      return;
    }



    // Make sure there is a body to insert into
    if (!document.body) {

      const body = document.createElement('body');
      document.documentElement.appendChild(body);

    }

    const toolbar = document.createElement('div');
    toolbar.className = 'ai-pdf-toolbar';

    toolbar.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 8px;
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    toolbar.innerHTML = `
      <button class="ai-pdf-btn" data-action="summarize" title="Resumir PDF" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="13" x2="15" y2="13"/>
          <line x1="9" y1="17" x2="15" y2="17"/>
        </svg>
        Summarize
      </button>
      <button class="ai-pdf-btn" data-action="translate" title="Translate PDF" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
          <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14.5 17h6"/>
        </svg>
        Translate
      </button>
      <button class="ai-pdf-btn" data-action="chat" title="Chat with PDF" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Chat
      </button>
      <button class="ai-pdf-btn" data-action="ocr" title="Extract Text (OCR)" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="7" y1="10" x2="17" y2="10"/>
          <line x1="7" y1="14" x2="17" y2="14"/>
        </svg>
        OCR
      </button>
    `;


    try {
      document.body.appendChild(toolbar);


    } catch (error) {
      console.error('❌ Error inserting toolbar:', error);
      console.error('❌ Error stack:', error.stack);
    }

    // Add hover effects

    toolbar.querySelectorAll('.ai-pdf-btn').forEach((btn, index) => {

      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'none';
      });
    });

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




    

    const isPDF = isPDFPage();

    if (isPDF) {


        
      
      // Try to create toolbar several times because the viewer DOM may take time
      let attempts = 0;
      const maxAttempts = 10;
      
      const tryCreateToolbar = () => {
        attempts++;


        if (document.body) {

          createPDFToolbar();

        } else if (attempts < maxAttempts) {

          setTimeout(tryCreateToolbar, 500);
        } else {
          console.error('❌ Could not create toolbar after', maxAttempts, 'attempts');
          console.error('❌ Final DOM state:', {
            documentElement: document.documentElement,
            children: document.documentElement?.children,
            innerHTML: document.documentElement?.innerHTML?.substring(0, 500)
          });
        }
      };
      
      // Start trying immediately

      tryCreateToolbar();
    } else {
      console.log('ℹ️ Not a PDF page, PDFModule is not initialized');
      console.log('ℹ️ Detection details:', {
        url: window.location.href,
        protocol: window.location.protocol,
        pathname: window.location.pathname
      });
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

  // Immediate initialization for local files and chrome-extension PDFs
  const isLocalFile = window.location.protocol === 'file:';
  const isChromeExtPDF = window.location.protocol === 'chrome-extension:' && 
                         (window.location.href.includes('file:///') || window.location.href.includes('.pdf'));
  

   
  
  if (isLocalFile || isChromeExtPDF) {



    // For local files, try multiple times because the DOM may not be ready
    let initAttempts = 0;
    const tryInit = () => {
      initAttempts++;

      PDFModule.init();
      
      // Check that the toolbar was created
      setTimeout(() => {
        const toolbarExists = document.querySelector('.ai-pdf-toolbar');

        
        if (!toolbarExists && initAttempts < 5) {

          setTimeout(tryInit, 300);
        } else if (toolbarExists) {

        } else {
          console.error('❌ Could not create toolbar after 5 attempts');
        }
      }, 200);
    };

    tryInit();
  } else {

    // For web URLs, use the standard method
    if (document.readyState === 'loading') {

      document.addEventListener('DOMContentLoaded', () => {

        PDFModule.init();
      });
    } else {

      PDFModule.init();
    }
  }
  
  // Additional fallback after 1 second for all cases
  setTimeout(() => {



    if (!document.querySelector('.ai-pdf-toolbar') && PDFModule.isPDFPage()) {

      PDFModule.init();
    } else if (document.querySelector('.ai-pdf-toolbar')) {

    } else {

    }
  }, 1000);
  
  // Final fallback after 2 seconds
  setTimeout(() => {




    
    if (!document.querySelector('.ai-pdf-toolbar') && PDFModule.isPDFPage()) {

      PDFModule.init();
    } else if (document.querySelector('.ai-pdf-toolbar')) {

    } else {

    }
  }, 2000);

}



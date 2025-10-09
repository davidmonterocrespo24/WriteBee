const PDFModule = (function() {
  console.log('🚀 PDFModule: Iniciando carga del módulo...');
  
  let currentPDF = null;

  /**
   * Check if current page is a PDF
   */
  function isPDFPage() {
    // 1. Detectar por URL - el método más confiable
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const isPDFUrl = pathname.endsWith('.pdf') || url.includes('.pdf');
    
    // 2. Detectar PDF local (file://)
    const isLocalPDF = window.location.protocol === 'file:' && isPDFUrl;
    
    // 3. Detectar Chrome Extension PDF viewer
    // La URL será algo como: chrome-extension://xxxxx/file:///C:/path/to/file.pdf
    const isChromeExtensionPDF = window.location.protocol === 'chrome-extension:' && 
                                 (url.includes('file:///') || url.includes('.pdf'));
    
    // 4. Detectar por content type del documento
    const isPDFContentType = document.contentType === 'application/pdf';
    
    // 5. Detectar visor de PDF embebido en Chrome
    const hasEmbedPDF = document.querySelector('embed[type="application/pdf"]') !== null;
    
    // 6. Detectar iframe de PDF
    const hasPDFIframe = document.querySelector('iframe[src*=".pdf"]') !== null;
    
    // 7. Chrome a veces usa un <embed> como elemento raíz
    const isRootEmbed = document.documentElement.tagName === 'EMBED';
    
    // 8. Detectar PDF.js viewer por URL params
    const hasPDFParam = url.includes('viewer.html?file=') || url.includes('/pdfjs/');
    
    const result = isPDFUrl || isLocalPDF || isChromeExtensionPDF || isPDFContentType || 
                   hasEmbedPDF || hasPDFIframe || isRootEmbed || hasPDFParam;
    
    console.log('📄 Verificando si es PDF:', {
      pdfUrl: isPDFUrl,
      localPDF: isLocalPDF,
      chromeExtPDF: isChromeExtensionPDF,
      contentType: isPDFContentType,
      embedPDF: hasEmbedPDF,
      pdfIframe: hasPDFIframe,
      rootEmbed: isRootEmbed,
      pdfParam: hasPDFParam,
      protocol: window.location.protocol,
      pathname: window.location.pathname,
      url: window.location.href,
      resultado: result
    });
    
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
    console.log('🔧 createPDFToolbar: Función llamada');
    
    if (document.querySelector('.ai-pdf-toolbar')) {
      console.log('📄 Toolbar ya existe, no se crea de nuevo');
      return;
    }

    console.log('📄 Creando toolbar de PDF...');
    console.log('📄 document.body existe:', !!document.body);
    console.log('📄 document.documentElement:', document.documentElement?.tagName);

    // Asegurarse de que hay un body donde insertar
    if (!document.body) {
      console.log('⚠️ No hay body aún, creando uno temporal...');
      const body = document.createElement('body');
      document.documentElement.appendChild(body);
      console.log('✅ Body temporal creado');
    }

    const toolbar = document.createElement('div');
    toolbar.className = 'ai-pdf-toolbar';
    console.log('📄 Elemento toolbar creado:', toolbar);
    
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
    
    console.log('📄 Estilos aplicados al toolbar');
    
    toolbar.innerHTML = `
      <button class="ai-pdf-btn" data-action="summarize" title="Resumir PDF" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="13" x2="15" y2="13"/>
          <line x1="9" y1="17" x2="15" y2="17"/>
        </svg>
        Resumir
      </button>
      <button class="ai-pdf-btn" data-action="translate" title="Traducir PDF" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
          <path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14.5 17h6"/>
        </svg>
        Traducir
      </button>
      <button class="ai-pdf-btn" data-action="chat" title="Chat con PDF" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        Chat
      </button>
      <button class="ai-pdf-btn" data-action="ocr" title="Extraer Texto (OCR)" style="display: flex; align-items: center; gap: 8px; padding: 10px 16px; border: none; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px;">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="7" y1="10" x2="17" y2="10"/>
          <line x1="7" y1="14" x2="17" y2="14"/>
        </svg>
        OCR
      </button>
    `;

    console.log('📄 Intentando agregar toolbar al body...');
    console.log('📄 document.body antes de appendChild:', document.body);
    
    try {
      document.body.appendChild(toolbar);
      console.log('✅ Toolbar de PDF insertado correctamente');
      console.log('📄 Toolbar en DOM:', document.querySelector('.ai-pdf-toolbar'));
    } catch (error) {
      console.error('❌ Error al insertar toolbar:', error);
      console.error('❌ Error stack:', error.stack);
    }

    // Agregar efectos hover
    console.log('📄 Agregando event listeners a botones...');
    toolbar.querySelectorAll('.ai-pdf-btn').forEach((btn, index) => {
      console.log(`📄 Agregando listeners al botón ${index + 1}:`, btn.dataset.action);
      
      btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
        btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      });
      
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
        btn.style.boxShadow = 'none';
      });
    });
    
    console.log('✅ Event listeners agregados');

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
    console.log('🔍 PDFModule.init() llamado');
    console.log('� Timestamp:', new Date().toISOString());
    console.log('🔍 document.readyState:', document.readyState);
    console.log('🔍 window.location:', {
      href: window.location.href,
      protocol: window.location.protocol,
      pathname: window.location.pathname,
      search: window.location.search
    });
    console.log('�📄 Verificando si es página PDF...');
    
    const isPDF = isPDFPage();
    console.log('📄 Resultado de isPDFPage():', isPDF);
    
    if (isPDF) {
      console.log('✅ PDF detectado, esperando a crear toolbar...');
      console.log('📄 Estado del DOM actual:', {
        body: !!document.body,
        bodyTagName: document.body?.tagName,
        documentElement: document.documentElement?.tagName,
        childElementCount: document.documentElement?.childElementCount
      });
      
      // Intentar crear toolbar varias veces porque el DOM del visor puede tardar
      let attempts = 0;
      const maxAttempts = 10;
      
      const tryCreateToolbar = () => {
        attempts++;
        console.log(`📄 Intento ${attempts}/${maxAttempts} de crear toolbar...`);
        console.log(`📄 document.body en intento ${attempts}:`, !!document.body);
        
        if (document.body) {
          console.log(`✅ Body encontrado en intento ${attempts}, creando toolbar...`);
          createPDFToolbar();
          console.log('✅ PDFModule inicializado correctamente');
        } else if (attempts < maxAttempts) {
          console.log(`⏳ Body no disponible en intento ${attempts}, reintentando en 500ms...`);
          setTimeout(tryCreateToolbar, 500);
        } else {
          console.error('❌ No se pudo crear toolbar después de', maxAttempts, 'intentos');
          console.error('❌ Estado final del DOM:', {
            documentElement: document.documentElement,
            children: document.documentElement?.children,
            innerHTML: document.documentElement?.innerHTML?.substring(0, 500)
          });
        }
      };
      
      // Empezar a intentar inmediatamente
      console.log('🚀 Iniciando intentos de crear toolbar...');
      tryCreateToolbar();
    } else {
      console.log('ℹ️ No es una página PDF, PDFModule no se inicializa');
      console.log('ℹ️ Detalles de detección:', {
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

console.log('📦 PDFModule definido, valor:', PDFModule);
console.log('📦 Funciones disponibles:', Object.keys(PDFModule));

// Initialize if on PDF page
if (typeof window !== 'undefined') {
  console.log('📄 PDFModule cargado, registrando globalmente');
  console.log('📄 window.location.href:', window.location.href);
  console.log('📄 window.location.protocol:', window.location.protocol);
  
  window.PDFModule = PDFModule;

  // Inicialización inmediata para archivos locales y chrome-extension PDFs
  const isLocalFile = window.location.protocol === 'file:';
  const isChromeExtPDF = window.location.protocol === 'chrome-extension:' && 
                         (window.location.href.includes('file:///') || window.location.href.includes('.pdf'));
  
  console.log('🔍 Verificando tipo de archivo:', {
    isLocalFile,
    isChromeExtPDF,
    protocol: window.location.protocol,
    href: window.location.href
  });
  
  if (isLocalFile || isChromeExtPDF) {
    console.log('📄 Archivo local o Chrome Extension PDF detectado, inicializando inmediatamente...');
    console.log('📄 Protocol:', window.location.protocol);
    console.log('📄 URL:', window.location.href);
    
    // Para archivos locales, intentar múltiples veces porque el DOM puede no estar listo
    let initAttempts = 0;
    const tryInit = () => {
      initAttempts++;
      console.log(`📄 Intento de inicialización ${initAttempts} para archivo local/extension...`);
      PDFModule.init();
      
      // Verificar que el toolbar se creó
      setTimeout(() => {
        const toolbarExists = document.querySelector('.ai-pdf-toolbar');
        console.log(`📄 Verificación post-init (intento ${initAttempts}):`, {
          toolbarExists: !!toolbarExists,
          toolbar: toolbarExists
        });
        
        if (!toolbarExists && initAttempts < 5) {
          console.log('📄 Toolbar no encontrado, reintentando en 300ms...');
          setTimeout(tryInit, 300);
        } else if (toolbarExists) {
          console.log('🎉 ¡Toolbar creado exitosamente!');
        } else {
          console.error('❌ No se pudo crear el toolbar después de 5 intentos');
        }
      }, 200);
    };
    
    console.log('🚀 Iniciando secuencia de inicialización...');
    tryInit();
  } else {
    console.log('📄 URL web estándar detectada, usando método estándar...');
    // Para URLs web, usar el método estándar
    if (document.readyState === 'loading') {
      console.log('📄 DOM en estado loading, esperando DOMContentLoaded...');
      document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOMContentLoaded disparado, inicializando PDFModule');
        PDFModule.init();
      });
    } else {
      console.log('📄 DOM ya cargado, inicializando PDFModule inmediatamente');
      PDFModule.init();
    }
  }
  
  // Fallback adicional después de 1 segundo para todos los casos
  setTimeout(() => {
    console.log('⏰ Verificación adicional después de 1 segundo...');
    console.log('⏰ Toolbar existe:', !!document.querySelector('.ai-pdf-toolbar'));
    console.log('⏰ Es PDF:', PDFModule.isPDFPage());
    
    if (!document.querySelector('.ai-pdf-toolbar') && PDFModule.isPDFPage()) {
      console.log('📄 Toolbar no encontrado, reintentando inicialización...');
      PDFModule.init();
    } else if (document.querySelector('.ai-pdf-toolbar')) {
      console.log('✅ Toolbar ya existe, no es necesario reintentar');
    } else {
      console.log('ℹ️ No es un PDF, no se crea toolbar');
    }
  }, 1000);
  
  // Fallback final después de 2 segundos
  setTimeout(() => {
    console.log('⏰⏰ Verificación final después de 2 segundos...');
    console.log('⏰⏰ Toolbar existe:', !!document.querySelector('.ai-pdf-toolbar'));
    console.log('⏰⏰ Es PDF:', PDFModule.isPDFPage());
    console.log('⏰⏰ Estado del DOM:', {
      readyState: document.readyState,
      body: !!document.body,
      documentElement: !!document.documentElement
    });
    
    if (!document.querySelector('.ai-pdf-toolbar') && PDFModule.isPDFPage()) {
      console.log('📄 ÚLTIMO INTENTO: Forzando creación de toolbar...');
      PDFModule.init();
    } else if (document.querySelector('.ai-pdf-toolbar')) {
      console.log('🎉 ¡Toolbar funcionando correctamente!');
    } else {
      console.log('ℹ️ No es un PDF o el toolbar ya existe');
    }
  }, 2000);
  
  console.log('✅ PDFModule completamente inicializado y listeners registrados');
}

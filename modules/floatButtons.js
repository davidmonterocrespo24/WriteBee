/**
 * Float Buttons Module - Manages floating action buttons that appear on text selection and context-specific features
 * @author David Montero Crespo
 * @project WriteBee
 */
const FloatButtonsModule = (function() {
  let buttonsContainer = null;
  let buttons = [];
  let isExpanded = false;

  const BUTTON_CONFIGS = {
    gmail: {
      id: 'gmail',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>`,
      label: 'Resumir No Leídos',
      color: '#EA4335',
      urlPattern: 'mail.google.com',
      onClick: async () => {

        if (typeof GmailModule !== 'undefined' && typeof GmailModule.handleUnreadSummary === 'function') {
          await GmailModule.handleUnreadSummary();
        } else {
          console.error('❌ GmailModule o handleUnreadSummary no está disponible');
          alert('El módulo de Gmail no está cargado. Por favor recarga la página.');
        }
      }
    },
    summarize: {
      id: 'summarize',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        <path d="M9 8h3"/>
      </svg>`,
      label: 'Resumir Página',
      color: '#9C27B0',
      urlPattern: null, // Siempre visible
      onClick: async () => {
        await summarizeCurrentPage();
      }
    },
    translate: {
      id: 'translate',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M5 8h6m-6 4h3m10-9a17.8 17.8 0 0 1-5 10m5-10L12 3m6 0a17.8 17.8 0 0 0-5 10m0 0H4m13 0a17.8 17.8 0 0 1 5 10m-5-10l6 9"/>
        <path d="m2 21 4-9 4 9"/>
        <path d="M3.5 18h5"/>
      </svg>`,
      label: 'Traducir Página',
      color: '#4285F4',
      urlPattern: null, // Siempre visible
      onClick: async () => {
        await translateFullPage();
      }
    },
    outlook: {
      id: 'outlook',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
        <path d="M2 7l10 6l10-6"/>
        <circle cx="7" cy="12" r="2.5" fill="currentColor" opacity="0.3"/>
        <path d="M7 9.5v5" stroke-width="1.8"/>
      </svg>`,
      label: 'Resumir No Leídos',
      color: '#0078D4',
      urlPattern: 'outlook.live.com|outlook.office.com',
      onClick: async () => {



        if (window.OutlookModule && typeof OutlookModule.handleUnreadSummary === 'function') {

          await OutlookModule.handleUnreadSummary();
        } else {
          console.error('❌ OutlookModule o handleUnreadSummary no está disponible');
          console.error('window.OutlookModule:', window.OutlookModule);
          alert('El módulo de Outlook no está cargado. Por favor recarga la página.');
        }
      }
    },
    google: {
      id: 'google',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="11" cy="11" r="8"/>
        <path d="M21 21l-4.35-4.35"/>
        <circle cx="11" cy="11" r="3" fill="currentColor" opacity="0.2"/>
      </svg>`,
      label: 'Resumen Google',
      color: '#34A853',
      urlPattern: 'google.com/search',
      onClick: async () => {

        if (typeof GoogleModule !== 'undefined' && typeof GoogleModule.summarizeResults === 'function') {
          await GoogleModule.summarizeResults();
        } else {
          console.error('❌ GoogleModule no está disponible');
          alert('El módulo de Google no está cargado. Por favor recarga la página.');
        }
      }
    },
    youtube: {
      id: 'youtube',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor"/>
      </svg>`,
      label: 'Resumen YouTube',
      color: '#FF0000',
      urlPattern: 'youtube.com/watch',
      onClick: async () => {

        if (typeof YoutubeModule !== 'undefined' && typeof YoutubeModule.summarizeVideo === 'function') {
          await YoutubeModule.summarizeVideo();
        } else {
          console.error('❌ YoutubeModule no está disponible');
          alert('El módulo de YouTube no está cargado. Por favor recarga la página.');
        }
      }
    },
    github: {
      id: 'github',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
      </svg>`,
      label: 'Resumen Repositorio',
      color: '#24292e',
      urlPattern: 'github.com',
      onClick: async () => {

        if (typeof GithubModule !== 'undefined' && typeof GithubModule.summarizeRepo === 'function') {
          await GithubModule.summarizeRepo();
        } else {
          console.error('❌ GithubModule no está disponible');
          alert('El módulo de GitHub no está cargado. Por favor recarga la página.');
        }
      }
    }
  };

  function init() {
    createButtonsContainer();
    updateVisibleButtons();
    
    // Observar cambios de URL
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        updateVisibleButtons();
      }
    }).observe(document, { subtree: true, childList: true });
  }

  function createButtonsContainer() {
    if (buttonsContainer) return;

    buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'ai-float-buttons-container';

    document.body.appendChild(buttonsContainer);
  }

  function updateVisibleButtons() {
    if (!buttonsContainer) return;

    // Limpiar botones existentes
    buttonsContainer.innerHTML = '';
    buttons = [];

    const currentUrl = window.location.href;

    // Crear botones según la URL actual
    Object.values(BUTTON_CONFIGS).forEach(config => {
      if (shouldShowButton(config, currentUrl)) {
        createFloatButton(config);
      }
    });
  }

  function shouldShowButton(config, url) {
    // Si no tiene patrón de URL, siempre se muestra
    if (!config.urlPattern) return true;

    // Verificar si la URL coincide con el patrón
    const patterns = config.urlPattern.split('|');
    return patterns.some(pattern => url.includes(pattern));
  }

  function createFloatButton(config) {
    const button = document.createElement('button');
    button.className = 'ai-float-feature-btn';
    button.id = `ai-float-btn-${config.id}`;
    button.setAttribute('aria-label', config.label);
    button.style.animationDelay = `${buttons.length * 0.05}s`;

    button.innerHTML = `
      <div>
        ${config.icon}
      </div>
      <div class="ai-float-tooltip">${config.label}</div>
    `;

    // Efectos hover
    button.addEventListener('mouseenter', () => {
      const tooltip = button.querySelector('.ai-float-tooltip');
      if (tooltip) tooltip.style.opacity = '1';
    });

    button.addEventListener('mouseleave', () => {
      const tooltip = button.querySelector('.ai-float-tooltip');
      if (tooltip) tooltip.style.opacity = '0';
    });

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      config.onClick();
    });

    // Prevenir que el mouseup cierre el diálogo que se va a crear
    button.addEventListener('mouseup', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });

    // También prevenir mousedown
    button.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });

    buttonsContainer.appendChild(button);
    buttons.push({ element: button, config });
  }

  async function translateText(text) {
    // Crear diálogo de traducción
    const dialog = createTranslateDialog(text);
    document.body.appendChild(dialog);

    const resultDiv = dialog.querySelector('.ai-translate-result');
    
    try {
      resultDiv.innerHTML = `
        <div style="color: #a5a7b1; text-align: center; padding: 40px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.5;">
            <circle cx="12" cy="12" r="10" opacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </path>
          </svg>
          <div>Traduciendo...</div>
        </div>
      `;

      const prompt = `Traduce el siguiente texto al español (si está en otro idioma) o al inglés (si está en español). Solo proporciona la traducción, sin explicaciones adicionales:

${text}`;

      const translation = await AIModule.aiAnswer(prompt);
      
      // Renderizar traducción
      MarkdownRenderer.renderToElement(resultDiv, translation);

    } catch (error) {
      resultDiv.innerHTML = `<div style="color: #ff6b6b; padding: 20px;">Error: ${error.message}</div>`;
    }
  }

  let isTranslating = false;
  let originalTexts = new Map(); // Guardar textos originales para poder revertir
  let translatedElements = new Set(); // Rastrear elementos ya traducidos
  let currentTargetLanguage = null; // Idioma objetivo actual

  async function summarizeCurrentPage() {

    // Cambiar el ícono del botón para indicar que está procesando
    const summarizeBtn = document.getElementById('ai-float-btn-summarize');
    if (summarizeBtn) {
      summarizeBtn.style.background = '#FFA726';
      summarizeBtn.querySelector('div:first-child').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" opacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
    }

    try {

      // Verificar que WebChatModule esté disponible
      if (typeof WebChatModule === 'undefined') {
        console.error('❌ WebChatModule no disponible');
        alert('El módulo de chat no está disponible. Por favor recarga la página.');
        return;
      }

      // 🔥 IMPORTANTE: Abrir el side panel PRIMERO (mientras el gesto del usuario aún es válido)

      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
          action: 'openSidePanel',
          data: {
            context: 'page-summary-loading',
            pageTitle: document.title,
            pageUrl: window.location.href,
            action: 'summarize',
            isLoading: true
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Error al abrir side panel:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else if (!response || !response.success) {
            console.error('❌ Error en respuesta:', response);
            reject(new Error(response?.error || 'Error desconocido'));
          } else {

            resolve();
          }
        });
      });

      // Pequeño delay para asegurar que el side panel esté listo
      await new Promise(resolve => setTimeout(resolve, 300));

      // Ahora generar el resumen
      // Extraer el contenido principal de la página
      const pageContent = extractPageContent();
      
      if (!pageContent.text || pageContent.text.length < 50) {
        throw new Error('No se pudo extraer suficiente contenido de la página');
      }

      // Indexar la página con RAG Engine

      if (typeof RAGEngine !== 'undefined') {
        const ragEngine = RAGEngine.getInstance();

        // Clear previous index
        ragEngine.clear();

        // Index current page
        await ragEngine.indexPage(pageContent.text, {
          title: pageContent.title,
          url: window.location.href,
          source: 'current_page'
        });

      } else {
        console.warn('⚠️ RAGEngine no disponible');
      }

      // Show loading indicator with user message
      chrome.runtime.sendMessage({
        action: 'showLoading',
        data: {
          userMessage: `I want to summarize this page: ${pageContent.title}`,
          isLoading: true
        }
      });

      // Small delay to ensure loading is shown
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate summary (loading dots will be shown)
      const summary = await WebChatModule.summarizePage((progress) => {

      });

      // Send summary to side panel that is already open
      // Include user message in the data
      chrome.runtime.sendMessage({
        action: 'chatData',
        data: {
          webChatMode: true,
          pageTitle: pageContent.title,
          pageUrl: window.location.href,
          pageContent: pageContent.text,
          selectedText: '',
          currentAnswer: summary,
          action: 'summarize',
          context: 'page-summary',
          userMessage: `I want to summarize this page: ${pageContent.title}` // Include user message
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending data:', chrome.runtime.lastError);
        } else {

        }
      });

      // Restaurar botón después de un momento
      setTimeout(() => {
        if (summarizeBtn) {
          summarizeBtn.style.background = BUTTON_CONFIGS.summarize.color;
          summarizeBtn.querySelector('div:first-child').innerHTML = BUTTON_CONFIGS.summarize.icon;
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Error al resumir página:', error);
      
      // Mensaje de error más específico
      let errorMessage = 'Error al resumir la página: ';
      
      if (error.message && error.message.includes('Extension context invalidated')) {
        errorMessage += 'La extensión se recargó. Por favor recarga la página e intenta de nuevo.';
      } else if (error.message && error.message.includes('not available')) {
        errorMessage += 'El servicio de IA no está disponible. Asegúrate de tener Chrome Canary con las APIs habilitadas.';
      } else {
        errorMessage += error.message || 'Error desconocido';
      }
      
      alert(errorMessage);
      
      // Restaurar botón en caso de error
      if (summarizeBtn) {
        summarizeBtn.style.background = BUTTON_CONFIGS.summarize.color;
        summarizeBtn.querySelector('div:first-child').innerHTML = BUTTON_CONFIGS.summarize.icon;
      }
    }
  }

  function extractPageContent() {
    // Obtener el título de la página
    const title = document.title || 'Sin título';

    // Intentar encontrar el contenido principal
    let mainContent = null;
    
    // Estrategia 1: Buscar elementos semánticos principales
    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.main-content',
      '#main-content',
      '.content',
      '#content',
      '.post-content',
      '.article-content'
    ];

    for (const selector of mainSelectors) {
      mainContent = document.querySelector(selector);
      if (mainContent) {

        break;
      }
    }

    // Si no se encuentra contenido principal, usar todo el body
    if (!mainContent) {
      mainContent = document.body;

    }

    // Extraer el texto, filtrando elementos no deseados
    const excludeSelectors = [
      'script',
      'style',
      'noscript',
      'iframe',
      'nav',
      'header',
      'footer',
      '.navigation',
      '.menu',
      '.sidebar',
      '.ads',
      '.advertisement',
      '.cookie-notice',
      '[class*="ai-"]' // Nuestros elementos
    ];

    // Clonar el contenido para no afectar la página
    const contentClone = mainContent.cloneNode(true);

    // Remover elementos excluidos
    excludeSelectors.forEach(selector => {
      const elements = contentClone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Extraer texto
    let text = contentClone.innerText || contentClone.textContent || '';
    
    // Limpiar el texto
    text = text
      .replace(/\s+/g, ' ') // Múltiples espacios a uno solo
      .replace(/\n{3,}/g, '\n\n') // Múltiples saltos de línea a máximo dos
      .trim();

    // Extraer encabezados para estructura adicional
    const headings = [];
    mainContent.querySelectorAll('h1, h2, h3').forEach(heading => {
      if (!heading.closest(excludeSelectors.join(','))) {
        headings.push(heading.textContent.trim());
      }
    });

    return {
      title,
      text,
      headings,
      length: text.length
    };
  }

  // Reemplaza la función translateFullPage() en FloatButtonsModule

async function translateFullPage() {
  if (isTranslating) {
    // Si ya está traducido, revertir
    revertTranslation();
    return;
  }

  // Verificar soporte de Translator API
  if (!('Translator' in self)) {
    alert('La API de traducción no está disponible en este navegador. Se requiere Chrome con soporte para Translator API.');
    return;
  }

  // Preguntar al usuario a qué idioma quiere traducir
  const targetLanguage = await showLanguageSelectionDialog();
  
  if (!targetLanguage) {

    return;
  }

  currentTargetLanguage = targetLanguage;

  // Cambiar botón a estado "procesando"
  const translateBtn = document.getElementById('ai-float-btn-translate');
  if (translateBtn) {
    translateBtn.style.background = '#FFA726';
    translateBtn.querySelector('div:first-child').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" opacity="0.3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
    `;
  }

  try {
    // Detectar idioma de la página usando solo LanguageDetector API
    const pageLanguage = await detectPageLanguage();

    // Verificar si es necesario traducir
    if (pageLanguage.toLowerCase() === targetLanguage.code.toLowerCase()) {
      const shouldSelectAgain = await showConfirmationDialog(
        'Mismo idioma detectado',
        `La página ya está en ${targetLanguage.name}. Por favor, elige un idioma diferente para traducir.`,
        'Elegir otro idioma',
        'Cancelar'
      );

      if (shouldSelectAgain) {
        resetTranslateButton(translateBtn);
        // Volver a mostrar el diálogo de selección de idiomas
        await translateFullPage();
      } else {
        resetTranslateButton(translateBtn);
      }
      return;
    }

    // Seleccionar elementos a traducir
    const elementsToTranslate = selectElementsToTranslate();
    
    if (elementsToTranslate.length === 0) {
      alert('No se encontró texto para traducir');
      resetTranslateButton(translateBtn);
      return;
    }

    // Mostrar progreso
    showTranslationProgress(0, elementsToTranslate.length, targetLanguage.name);

    // Crear instancia del Translator con manejo de descarga
    const translator = await createTranslatorWithDownload(pageLanguage, targetLanguage.code);
    
    if (!translator) {
      throw new Error('No se pudo crear el traductor');
    }

    // Traducir elementos de manera optimizada
    await translateElementsOptimized(translator, elementsToTranslate, targetLanguage.name);

    // Destruir translator
    translator.destroy();

    hideTranslationProgress();

    isTranslating = true;

    // Actualizar botón
    if (translateBtn) {
      translateBtn.style.background = '#4CAF50';
      translateBtn.querySelector('div:first-child').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      `;
      const tooltip = translateBtn.querySelector('.ai-float-tooltip');
      if (tooltip) tooltip.textContent = `Revertir (${targetLanguage.name})`;
    }

  } catch (error) {
    console.error('❌ Error en traducción:', error);
    alert('Error al traducir: ' + error.message);
    hideTranslationProgress();
    resetTranslateButton(translateBtn);
  }
}// Seleccionar elementos a traducir (versión mejorada)
function selectElementsToTranslate() {
  const elements = [];

  // Wide-range selectors with priority
  const selectors = [
    // Main content - paragraphs and headings
    'main p', 'main h1, main h2, main h3, main h4, main h5, main h6',
    'article p', 'article h1, article h2, article h3, article h4, article h5, article h6',
    '[role="main"] p', '[role="main"] h1, [role="main"] h2, [role="main"] h3, [role="main"] h4, [role="main"] h5, [role="main"] h6',
    '.content p', '.content h1, .content h2, .content h3, .content h4, .content h5, .content h6',
    '.post p', '.post h1, .post h2, .post h3, .post h4, .post h5, .post h6',
    '.entry p', '.entry h1, .entry h2, .entry h3, .entry h4, .entry h5, .entry h6',

    // Links and buttons in main content
    'main a', 'main button',
    'article a', 'article button',
    '[role="main"] a', '[role="main"] button',
    '.content a', '.content button',
    '.post a', '.post button',
    '.entry a', '.entry button',

    // Spans with visible text in main content
    'main span', 'article span', '[role="main"] span', '.content span',

    // Body elements if no structured main content
    'body > p', 'body > h1, body > h2, body > h3, body > h4, body > h5, body > h6',
    'body > a', 'body > button', 'body > span',

    // Common containers
    '.container p', '.wrapper p', '.page p', '.site-content p',
    '.container h1, .container h2, .container h3, .container h4, .container h5, .container h6',
    '.wrapper h1, .wrapper h2, .wrapper h3, .wrapper h4, .wrapper h5, .wrapper h6',
    '.container a', '.container button',
    '.wrapper a', '.wrapper button',
    '.page a', '.page button',
    '.site-content a', '.site-content button',

    // Lists and other content elements
    'main li', 'article li', '[role="main"] li',
    'main td, main th', 'article td, article th', '[role="main"] td, [role="main"] th',

    // Elements with common content classes
    '.content li', '.post li', '.entry li',
    '.content td, .content th', '.post td, .post th', '.entry td, .entry th',

    // Sections - paragraphs and headings
    'section p', '.section p', '.block p',
    'section h1, section h2, section h3, section h4, section h5, section h6',
    '.section h1, .section h2, .section h3, .section h4, .section h5, .section h6',
    'section a', 'section button',
    '.section a', '.section button',
    '.block a', '.block button'
  ];

  const foundElements = new Set();

  selectors.forEach(selector => {
    try {
      const nodes = document.querySelectorAll(selector);
      nodes.forEach(element => {
        // Evitar duplicados y elementos no deseados
        if (foundElements.has(element) ||
            element.closest('[class*="ai-"]') ||
            element.closest('script') ||
            element.closest('style') ||
            element.closest('nav') ||
            element.closest('header') ||
            element.closest('footer') ||
            element.closest('.sidebar') ||
            element.closest('.widget') ||
            element.closest('.advertisement') ||
            element.closest('.ads') ||
            element.closest('.ad') ||
            element.closest('[class*="menu"]') ||
            element.closest('[class*="nav"]') ||
            element.closest('[id*="menu"]') ||
            element.closest('[id*="nav"]')) {
          return;
        }

        // Verificar visibilidad
        const style = window.getComputedStyle(element);
        if (style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.opacity === '0') {
          return;
        }

        // Get full text of the element (including children)
        let text = getFullText(element);

        if (!text || text.length < 3) return;
        if (text.match(/^[\d\s\W]+$/)) return; // Only numbers/symbols

        // For links and buttons, don't filter by URL content
        // For other elements, skip if they contain URLs (likely navigation/meta content)
        const isLinkOrButton = element.tagName === 'A' || element.tagName === 'BUTTON';
        if (!isLinkOrButton && (text.includes('http://') || text.includes('https://'))) return;

        elements.push({
          element: element,
          text: text
        });

        foundElements.add(element);
      });
    } catch (e) {
      console.warn('Error con selector:', selector, e);
    }
  });

  return elements;
}

// Obtener todo el texto de un elemento (incluyendo elementos hijos)
function getFullText(element) {
  return element.textContent.trim();
}

// Reemplazar texto del elemento preservando estructura HTML
function replaceElementText(element, newText) {
  // Si el elemento solo tiene nodos de texto directos, reemplazarlos
  const childNodes = Array.from(element.childNodes);
  const hasOnlyTextNodes = childNodes.every(node => node.nodeType === Node.TEXT_NODE);

  if (hasOnlyTextNodes && childNodes.length > 0) {
    // Preservar espacios iniciales/finales del primer y último nodo
    const firstNode = childNodes[0];
    const lastNode = childNodes[childNodes.length - 1];

    if (firstNode.nodeType === Node.TEXT_NODE) {
      const leadingSpace = firstNode.textContent.match(/^\s*/)[0];
      const trailingSpace = lastNode.textContent.match(/\s*$/)[0];

      // Reemplazar todo el contenido
      element.textContent = leadingSpace + newText + trailingSpace;
    }
    return;
  }

  // Si tiene elementos HTML complejos, usar una estrategia diferente
  // Guardar la estructura HTML y reemplazar solo el texto
  const originalHTML = element.innerHTML;
  const textNodes = [];

  // Recolectar todos los nodos de texto
  function collectTextNodes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (let child of node.childNodes) {
        collectTextNodes(child);
      }
    }
  }

  collectTextNodes(element);

  if (textNodes.length === 1) {
    // Un solo nodo de texto, fácil de reemplazar
    const node = textNodes[0];
    const leadingSpace = node.textContent.match(/^\s*/)[0];
    const trailingSpace = node.textContent.match(/\s*$/)[0];
    node.textContent = leadingSpace + newText + trailingSpace;
  } else if (textNodes.length > 1) {
    // Múltiples nodos de texto, reemplazar el contenido completo
    // pero preservar la estructura HTML externa
    element.innerHTML = newText;
  } else {
    // No hay nodos de texto, usar textContent
    element.textContent = newText;
  }
}

// Crear traductor con manejo de descarga optimizado
async function createTranslatorWithDownload(sourceLang, targetLang) {
  try {
    // Normalizar códigos de idioma
    sourceLang = sourceLang.substring(0, 2).toLowerCase();
    targetLang = targetLang.substring(0, 2).toLowerCase();

    // Verificar disponibilidad
    const availability = await self.Translator.availability({
      sourceLanguage: sourceLang,
      targetLanguage: targetLang
    });

    if (availability === 'no') {
      throw new Error(`Par de idiomas ${sourceLang}->${targetLang} no soportado`);
    }

    if (availability === 'available') {
      // Ya disponible, crear directamente
      return await self.Translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      });
    }

    // Si es 'downloadable', mostrar progreso de descarga
    if (availability === 'downloadable') {
      showDownloadProgress();

      const translator = await self.Translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            updateDownloadProgress(e.loaded);
          });
        },
      });

      hideDownloadProgress();

      return translator;
    }

    throw new Error('Estado de disponibilidad desconocido');

  } catch (error) {
    console.error('❌ Error creando traductor:', error);
    hideDownloadProgress();
    throw error;
  }
}

// Función optimizada para traducir elementos
async function translateElementsOptimized(translator, elements, languageName) {
  let translatedCount = 0;
  const totalElements = elements.length;

  // Procesar en lotes más grandes para mejor rendimiento
  const batchSize = 5; // Aumentado de 3 a 5

  for (let i = 0; i < elements.length; i += batchSize) {
    const batch = elements.slice(i, i + batchSize);

    // Usar Promise.allSettled para mejor manejo de errores
    const results = await Promise.allSettled(
      batch.map(async (item) => {
        const translatedText = await translateTextOptimized(translator, item.text);

        // Guardar texto original
        if (!originalTexts.has(item.element)) {
          originalTexts.set(item.element, item.text);
        }

        // Reemplazar texto
        replaceElementText(item.element, translatedText);
        translatedElements.add(item.element);

        return true;
      })
    );

    // Contar exitos
    const successful = results.filter(r => r.status === 'fulfilled').length;
    translatedCount += successful;

    // Actualizar progreso
    showTranslationProgress(translatedCount, totalElements, languageName);

    // Log de errores si los hay
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.warn(`⚠️ ${failed.length} elementos fallaron en este lote`);
    }

    // Pequeña pausa para no sobrecargar (reducida)
    if (i + batchSize < elements.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

// Función optimizada para traducir texto individual
async function translateTextOptimized(translator, text) {
  // Para textos largos, usar streaming
  if (text.length > 1000) {
    const stream = translator.translateStreaming(text);
    let result = '';
    for await (const chunk of stream) {
      result = chunk; // El último chunk es el resultado completo
    }
    return result;
  } else {
    // Para textos cortos, usar traducción normal
    return await translator.translate(text);
  }
}

// Detectar idioma de la página usando solo LanguageDetector API
async function detectPageLanguage() {
  // 1. Intentar con atributo lang del documento
  const htmlLang = document.documentElement.lang;
  if (htmlLang && htmlLang.length >= 2) {
    return htmlLang.substring(0, 2).toLowerCase();
  }

  // 2. Usar LanguageDetector API
  try {
    if ('LanguageDetector' in self) {
      const detector = await self.LanguageDetector.create();

      // Obtener texto de muestra más eficiente
      const sampleText = getSampleText();

      if (sampleText) {
        const results = await detector.detect(sampleText);
        detector.destroy();

        if (results && results.length > 0 && results[0].confidence > 0.5) {
          return results[0].detectedLanguage.substring(0, 2).toLowerCase();
        }
      }
    }
  } catch (error) {
    console.warn('Error detectando idioma con LanguageDetector:', error);
  }

  // 3. Fallback simple basado en navegador
  const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
  return browserLang.toLowerCase();
}

// Obtener texto de muestra para detección
function getSampleText() {
  const paragraphs = document.querySelectorAll('p, h1, h2, h3');
  let text = '';
  
  for (let i = 0; i < Math.min(5, paragraphs.length); i++) {
    const t = paragraphs[i].textContent.trim();
    if (t.length > 20) {
      text += t + ' ';
      if (text.length > 300) break;
    }
  }
  
  return text.trim();
}

// Revertir traducción
function revertTranslation() {

  let revertedCount = 0;

  originalTexts.forEach((originalText, element) => {
    try {
      replaceElementText(element, originalText);
      revertedCount++;
    } catch (error) {
      console.warn('⚠️ Error revirtiendo:', error);
    }
  });

  originalTexts.clear();
  translatedElements.clear();
  isTranslating = false;
  currentTargetLanguage = null;

  hideTranslationProgress();

  const translateBtn = document.getElementById('ai-float-btn-translate');
  if (translateBtn) {
    resetTranslateButton(translateBtn);
    const tooltip = translateBtn.querySelector('.ai-float-tooltip');
    if (tooltip) tooltip.textContent = 'Traducir Página';
  }
}

// Helpers para progreso visual
function showTranslationProgress(current, total, languageName) {
  let progressDiv = document.getElementById('ai-translation-progress');
  
  if (!progressDiv) {
    progressDiv = document.createElement('div');
    progressDiv.id = 'ai-translation-progress';
    progressDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(26, 29, 41, 0.95);
      color: #e4e6eb;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-size: 14px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(66, 133, 244, 0.3);
    `;
    document.body.appendChild(progressDiv);
  }

  const percentage = Math.round((current / total) * 100);
  progressDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
        <circle cx="12" cy="12" r="10" opacity="0.3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
      <div>
        <div>Traduciendo a ${languageName}...</div>
        <div style="font-size: 12px; color: #a5a7b1; margin-top: 4px;">
          ${current} / ${total} (${percentage}%)
        </div>
      </div>
    </div>
  `;
}

function hideTranslationProgress() {
  const progressDiv = document.getElementById('ai-translation-progress');
  if (progressDiv) progressDiv.remove();
}

// Funciones para progreso de descarga del modelo
function showDownloadProgress() {
  let progressDiv = document.getElementById('ai-download-progress');

  if (!progressDiv) {
    progressDiv = document.createElement('div');
    progressDiv.id = 'ai-download-progress';
    progressDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(26, 29, 41, 0.95);
      color: #e4e6eb;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      font-size: 14px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 215, 0, 0.3);
    `;
    document.body.appendChild(progressDiv);
  }

  progressDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
        <circle cx="12" cy="12" r="10" opacity="0.3"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
      <div>
        <div>Downloading translation model...</div>
        <div style="font-size: 12px; color: #a5a7b1; margin-top: 4px;">
          This may take a few moments
        </div>
      </div>
    </div>
  `;
}

function updateDownloadProgress(percentage) {
  const progressDiv = document.getElementById('ai-download-progress');
  if (progressDiv) {
    const percent = Math.round(percentage * 100);
    progressDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
          <circle cx="12" cy="12" r="10" opacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
        <div>
          <div>Downloading translation model...</div>
          <div style="font-size: 12px; color: #a5a7b1; margin-top: 4px;">
            ${percent}% completed
          </div>
        </div>
      </div>
    `;
  }
}

function hideDownloadProgress() {
  const progressDiv = document.getElementById('ai-download-progress');
  if (progressDiv) progressDiv.remove();
}

function resetTranslateButton(btn) {
  if (btn) {
    btn.style.background = '#4285F4';
    btn.querySelector('div:first-child').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M5 8h6m-6 4h3m10-9a17.8 17.8 0 0 1-5 10m5-10L12 3m6 0a17.8 17.8 0 0 0-5 10m0 0H4m13 0a17.8 17.8 0 0 1 5 10m-5-10l6 9"/>
        <path d="m2 21 4-9 4 9"/>
        <path d="M3.5 18h5"/>
      </svg>
    `;
  }
}

  async function showLanguageSelectionDialog() {
    return new Promise((resolve) => {
      const languages = [
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'en', name: 'Inglés', flag: '🇬🇧' },
        { code: 'fr', name: 'Francés', flag: '🇫🇷' },
        { code: 'de', name: 'Alemán', flag: '🇩🇪' },
        { code: 'it', name: 'Italiano', flag: '🇮🇹' },
        { code: 'pt', name: 'Portugués', flag: '🇵🇹' },
        { code: 'ru', name: 'Ruso', flag: '🇷🇺' },
        { code: 'zh', name: 'Chino', flag: '🇨🇳' },
        { code: 'ja', name: 'Japonés', flag: '🇯🇵' },
        { code: 'ko', name: 'Coreano', flag: '🇰🇷' },
        { code: 'ar', name: 'Árabe', flag: '🇸🇦' },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
        { code: 'nl', name: 'Holandés', flag: '🇳🇱' },
        { code: 'pl', name: 'Polaco', flag: '🇵🇱' },
        { code: 'tr', name: 'Turco', flag: '🇹🇷' }
      ];

      // Detectar idioma del sistema para sugerirlo
      const systemLang = (navigator.language || navigator.userLanguage || 'es').split('-')[0].toLowerCase();
      const suggestedLang = languages.find(l => l.code === systemLang) || languages[0];

      const dialog = document.createElement('div');
      dialog.className = 'ai-language-dialog';
      dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        backdrop-filter: blur(4px);
      `;

      dialog.innerHTML = `
        <div style="
          background: #1a1d29;
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #e4e6eb; font-size: 20px; font-weight: 600;">
              🌐 Select translation language
            </h2>
            <button class="ai-lang-close-btn" style="
              background: none;
              border: none;
              color: #a5a7b1;
              cursor: pointer;
              font-size: 24px;
              padding: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 4px;
              transition: all 0.2s;
            ">×</button>
          </div>

          <div style="
            color: #a5a7b1;
            font-size: 13px;
            margin-bottom: 16px;
            padding: 12px;
            background: rgba(66, 133, 244, 0.1);
            border-radius: 8px;
            border-left: 3px solid #4285F4;
          ">
            💡 Suggested: <strong style="color: #4285F4;">${suggestedLang.flag} ${suggestedLang.name}</strong> (system language)
          </div>

          <div class="ai-language-grid" style="
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 10px;
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 16px;
            padding: 4px;
          ">
            ${languages.map(lang => `
              <button class="ai-lang-option" data-code="${lang.code}" data-name="${lang.name}" style="
                background: ${lang.code === suggestedLang.code ? 'rgba(66, 133, 244, 0.15)' : 'rgba(255, 255, 255, 0.05)'};
                border: 2px solid ${lang.code === suggestedLang.code ? '#4285F4' : 'transparent'};
                color: #e4e6eb;
                padding: 12px 16px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <span style="font-size: 20px;">${lang.flag}</span>
                <span>${lang.name}</span>
              </button>
            `).join('')}
          </div>

          <button class="ai-lang-cancel-btn" style="
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: #a5a7b1;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
          ">
            Cancelar
          </button>
        </div>
      `;

      document.body.appendChild(dialog);

      // Estilos hover para opciones de idioma
      const langOptions = dialog.querySelectorAll('.ai-lang-option');
      langOptions.forEach(option => {
        option.addEventListener('mouseenter', () => {
          option.style.background = 'rgba(66, 133, 244, 0.2)';
          option.style.borderColor = '#4285F4';
          option.style.transform = 'scale(1.05)';
        });
        option.addEventListener('mouseleave', () => {
          const isSuggested = option.dataset.code === suggestedLang.code;
          option.style.background = isSuggested ? 'rgba(66, 133, 244, 0.15)' : 'rgba(255, 255, 255, 0.05)';
          option.style.borderColor = isSuggested ? '#4285F4' : 'transparent';
          option.style.transform = 'scale(1)';
        });
        option.addEventListener('click', () => {
          const selectedLang = languages.find(l => l.code === option.dataset.code);
          dialog.remove();
          resolve(selectedLang);
        });
      });

      // Estilos hover para botones
      const closeBtn = dialog.querySelector('.ai-lang-close-btn');
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        closeBtn.style.color = '#e4e6eb';
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.background = 'none';
        closeBtn.style.color = '#a5a7b1';
      });
      closeBtn.addEventListener('click', () => {
        dialog.remove();
        resolve(null);
      });

      const cancelBtn = dialog.querySelector('.ai-lang-cancel-btn');
      cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        cancelBtn.style.color = '#e4e6eb';
      });
      cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        cancelBtn.style.color = '#a5a7b1';
      });
      cancelBtn.addEventListener('click', () => {
        dialog.remove();
        resolve(null);
      });

      // Cerrar con ESC
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          dialog.remove();
          resolve(null);
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
  }

  async function showConfirmationDialog(title, message, confirmText, cancelText) {
    return new Promise((resolve) => {
      const dialog = document.createElement('div');
      dialog.className = 'ai-confirmation-dialog';
      dialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10002;
        backdrop-filter: blur(4px);
      `;

      dialog.innerHTML = `
        <div style="
          background: #1a1d29;
          border-radius: 16px;
          padding: 24px;
          max-width: 450px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        ">
          <h2 style="margin: 0 0 16px 0; color: #e4e6eb; font-size: 18px; font-weight: 600;">
            ${title}
          </h2>
          
          <p style="margin: 0 0 24px 0; color: #b8bcc8; font-size: 14px; line-height: 1.6;">
            ${message}
          </p>

          <div style="display: flex; gap: 12px;">
            <button class="ai-confirm-yes" style="
              flex: 1;
              background: linear-gradient(135deg, #ffd400 0%, #ffb700 100%);
              border: none;
              color: #1a1a1a;
              padding: 12px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 600;
              transition: all 0.2s;
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            ">
              ${confirmText}
            </button>
            
            <button class="ai-confirm-no" style="
              flex: 1;
              background: rgba(255, 255, 255, 0.05);
              border: 1px solid rgba(255, 255, 255, 0.1);
              color: #a5a7b1;
              padding: 12px;
              border-radius: 8px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              transition: all 0.2s;
            ">
              ${cancelText}
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(dialog);

      const yesBtn = dialog.querySelector('.ai-confirm-yes');
      const noBtn = dialog.querySelector('.ai-confirm-no');

      // Hover effects
      yesBtn.addEventListener('mouseenter', () => {
        yesBtn.style.transform = 'translateY(-2px)';
        yesBtn.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
      });
      yesBtn.addEventListener('mouseleave', () => {
        yesBtn.style.transform = 'translateY(0)';
        yesBtn.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
      });

      noBtn.addEventListener('mouseenter', () => {
        noBtn.style.background = 'rgba(255, 255, 255, 0.1)';
        noBtn.style.color = '#e4e6eb';
      });
      noBtn.addEventListener('mouseleave', () => {
        noBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        noBtn.style.color = '#a5a7b1';
      });

      // Click handlers
      yesBtn.addEventListener('click', () => {
        dialog.remove();
        resolve(true);
      });

      noBtn.addEventListener('click', () => {
        dialog.remove();
        resolve(false);
      });

      // Cerrar con ESC = No
      const handleEsc = (e) => {
        if (e.key === 'Escape') {
          dialog.remove();
          resolve(false);
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
  }

  function getLanguageName(langCode) {
    const languages = {
      'es': 'español',
      'en': 'inglés',
      'fr': 'francés',
      'de': 'alemán',
      'it': 'italiano',
      'pt': 'portugués',
      'zh': 'chino',
      'ja': 'japonés',
      'ko': 'coreano',
      'ru': 'ruso',
      'ar': 'árabe',
      'hi': 'hindi',
      'nl': 'holandés',
      'pl': 'polaco',
      'tr': 'turco'
    };
    return languages[langCode] || langCode;
  }

  function showTranslationProgress(current, total, languageName) {
    let progressDiv = document.getElementById('ai-translation-progress');
    
    if (!progressDiv) {
      progressDiv = document.createElement('div');
      progressDiv.id = 'ai-translation-progress';
      progressDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(26, 29, 41, 0.95);
        color: #e4e6eb;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-size: 14px;
        font-weight: 500;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(66, 133, 244, 0.3);
      `;
      document.body.appendChild(progressDiv);
    }

    const percentage = Math.round((current / total) * 100);
    progressDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px;">
          <circle cx="12" cy="12" r="10" opacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
        <div>
          <div>Traduciendo a ${languageName}...</div>
          <div style="font-size: 12px; color: #a5a7b1; margin-top: 4px;">
            ${current} de ${total} elementos (${percentage}%)
          </div>
        </div>
      </div>
    `;
  }

  function hideTranslationProgress() {
    const progressDiv = document.getElementById('ai-translation-progress');
    if (progressDiv) {
      progressDiv.remove();
    }
  }

  function resetTranslateButton(translateBtn) {
    translateBtn.style.background = BUTTON_CONFIGS.translate.color;
    translateBtn.querySelector('div:first-child').innerHTML = BUTTON_CONFIGS.translate.icon;
  }

  function revertTranslation() {

    let revertedCount = 0;

    // Restaurar textos originales
    originalTexts.forEach((originalText, element) => {
      try {
        // Simplemente usar innerText para restaurar
        // Esto funciona bien para la mayoría de los casos
        element.innerText = originalText;
        revertedCount++;
      } catch (error) {
        // Si innerText falla, intentar con textContent
        try {
          element.textContent = originalText;
          revertedCount++;
        } catch (e) {
          console.warn('⚠️ Error al revertir elemento:', error);
        }
      }
    });

    // Limpiar los mapas y sets
    originalTexts.clear();
    translatedElements.clear();
    isTranslating = false;
    currentTargetLanguage = null;

    // Ocultar progreso si existe
    hideTranslationProgress();

    // Restaurar botón
    const translateBtn = document.getElementById('ai-float-btn-translate');
    if (translateBtn) {
      resetTranslateButton(translateBtn);
      const tooltip = translateBtn.querySelector('.ai-float-tooltip');
      if (tooltip) tooltip.textContent = 'Traducir Página';
    }

  }

  function createTranslateDialog(originalText) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel';
    dialog.dataset.pinned = 'true';
    
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.width = 'min(600px, 92vw)';

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="Traductor AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">Traductor AI</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        <div class="ai-gmail-section">
          <div class="ai-gmail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Texto Original</span>
          </div>
          <div style="padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; color: #b8bcc8; font-size: 14px; line-height: 1.6;">
            ${escapeHtml(originalText)}
          </div>
        </div>

        <div class="ai-gmail-section">
          <div class="ai-gmail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M5 8h14M5 8a2 2 0 1 1 0-4h14a2 2 0 1 1 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>
            </svg>
            <span>Traducción</span>
          </div>
          <div class="ai-translate-result"></div>
        </div>

        <div style="display: flex; gap: 8px; margin-top: 16px;">
          <button class="ai-gmail-copy-btn" style="flex: 1;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
            Copiar traducción
          </button>
        </div>
      </div>
    `;

    // Hacer arrastrable
    makeDraggable(dialog);

    // Eventos
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => dialog.remove());

    const copyBtn = dialog.querySelector('.ai-gmail-copy-btn');
    copyBtn.addEventListener('click', () => {
      const text = dialog.querySelector('.ai-translate-result').innerText;
      navigator.clipboard.writeText(text).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          ¡Copiado!
        `;
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
      });
    });

    return dialog;
  }

  function makeDraggable(dialog) {
    const header = dialog.querySelector('.ai-draggable');
    let isDragging = false;
    let currentX, currentY, initialX, initialY;

    header.addEventListener('mousedown', dragStart);

    function dragStart(e) {
      if (e.target.closest('button')) return;
      isDragging = true;
      initialX = e.clientX - (parseInt(dialog.style.left) || 0);
      initialY = e.clientY - (parseInt(dialog.style.top) || 0);
      document.addEventListener('mousemove', drag);
      document.addEventListener('mouseup', dragEnd);
    }

    function drag(e) {
      if (!isDragging) return;
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      dialog.style.left = currentX + 'px';
      dialog.style.top = currentY + 'px';
      dialog.style.transform = 'none';
    }

    function dragEnd() {
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('mouseup', dragEnd);
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Agregar estilos CSS adicionales si son necesarios
  function addStyles() {
    // Los estilos principales están en styles.css
    // Esta función se mantiene por compatibilidad
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      addStyles();
      init();
    });
  } else {
    addStyles();
    init();
  }

  // API pública para otros módulos
  return {
    init,
    updateVisibleButtons,
    addCustomButton: function(config) {
      BUTTON_CONFIGS[config.id] = config;
      updateVisibleButtons();
    },
    removeButton: function(id) {
      delete BUTTON_CONFIGS[id];
      updateVisibleButtons();
    }
  };
})();



// Creado por David Montero Crespo para WriteBee

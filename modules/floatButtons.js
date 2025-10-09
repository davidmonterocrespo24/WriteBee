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
        console.log('🔘 Botón Gmail clickeado');
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
        <path d="M5 8h14M5 8a2 2 0 1 1 0-4h14a2 2 0 1 1 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>
        <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
        <path d="M7 21h10"/>
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
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <circle cx="12" cy="11" r="3"/>
      </svg>`,
      label: 'Outlook',
      color: '#0078D4',
      urlPattern: 'outlook.live.com|outlook.office.com',
      onClick: () => {
        if (window.OutlookModule && typeof OutlookModule.handleUnreadSummary === 'function') {
          OutlookModule.handleUnreadSummary();
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
        console.log('🔘 Botón Google clickeado');
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
        console.log('🔘 Botón YouTube clickeado');
        if (typeof YoutubeModule !== 'undefined' && typeof YoutubeModule.summarizeVideo === 'function') {
          await YoutubeModule.summarizeVideo();
        } else {
          console.error('❌ YoutubeModule no está disponible');
          alert('El módulo de YouTube no está cargado. Por favor recarga la página.');
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
    buttonsContainer.style.cssText = `
      position: fixed;
      bottom: 80px;
      right: 24px;
      z-index: 9998;
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: flex-end;
    `;

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
    button.style.cssText = `
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: ${config.color};
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: visible;
      opacity: 0;
      transform: scale(0.8) translateX(20px);
      animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      animation-delay: ${buttons.length * 0.05}s;
    `;

    button.innerHTML = `
      <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        ${config.icon}
      </div>
      <div class="ai-float-tooltip" style="
        position: absolute;
        right: 60px;
        top: 50%;
        transform: translateY(-50%);
        background: #1a1d29;
        color: #e4e6eb;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      ">${config.label}</div>
    `;

    // Efectos hover
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = `0 6px 20px ${config.color}66`;
      const tooltip = button.querySelector('.ai-float-tooltip');
      if (tooltip) tooltip.style.opacity = '1';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
      const tooltip = button.querySelector('.ai-float-tooltip');
      if (tooltip) tooltip.style.opacity = '0';
    });

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Animación de click
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 150);

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
    console.log('📄 Iniciando resumen de página...');

    // Cambiar el ícono del botón para indicar que está procesando
    const summarizeBtn = document.getElementById('ai-float-btn-summarize');
    if (summarizeBtn) {
      summarizeBtn.style.background = '#FFA726';
      summarizeBtn.querySelector('div[style*="width: 24px"]').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;">
          <circle cx="12" cy="12" r="10" opacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
    }

    try {
      console.log('📝 Iniciando resumen de página...');
      
      // Verificar que WebChatModule esté disponible
      if (typeof WebChatModule === 'undefined') {
        console.error('❌ WebChatModule no disponible');
        alert('El módulo de chat no está disponible. Por favor recarga la página.');
        return;
      }

      // Extraer el contenido principal de la página
      const pageContent = extractPageContent();
      
      if (!pageContent.text || pageContent.text.length < 50) {
        alert('No se encontró suficiente contenido para resumir en esta página');
        return;
      }

      console.log(`📝 Contenido extraído: ${pageContent.text.length} caracteres`);

      // Indexar la página con RAG Engine
      console.log('� Indexando página con RAG Engine...');
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
        
        console.log('✅ Página indexada exitosamente');
      } else {
        console.warn('⚠️ RAGEngine no disponible');
      }

      // Generar resumen inicial
      console.log('� Generando resumen inicial...');
      const summary = await WebChatModule.summarizePage((progress) => {
        console.log('📊 Progreso:', progress);
      });

      console.log('✅ Resumen generado:', summary.substring(0, 100) + '...');

      // Abrir el side panel mediante el background script
      console.log('💬 Abriendo side panel con datos...');
      
      // Enviar mensaje al background para abrir el panel CON los datos
      chrome.runtime.sendMessage({
        action: 'openSidePanel',
        data: {
          webChatMode: true,
          pageTitle: pageContent.title,
          pageUrl: window.location.href,
          pageContent: pageContent.text,
          selectedText: '', // No hay texto seleccionado
          currentAnswer: summary, // El resumen como respuesta inicial
          action: 'summarize',
          context: 'page-summary'
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error al abrir side panel:', chrome.runtime.lastError);
        } else {
          console.log('✅ Side panel abierto correctamente');
        }
      });

      // Restaurar botón después de un momento
      setTimeout(() => {
        if (summarizeBtn) {
          summarizeBtn.style.background = '#9C27B0';
          summarizeBtn.querySelector('div[style*="width: 24px"]').innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 24px; height: 24px;">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              <path d="M9 8h3"/>
            </svg>
          `;
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
        summarizeBtn.style.background = '#9C27B0';
        summarizeBtn.querySelector('div[style*="width: 24px"]').innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 24px; height: 24px;">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            <path d="M9 8h3"/>
          </svg>
        `;
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
        console.log(`✅ Contenido encontrado usando selector: ${selector}`);
        break;
      }
    }

    // Si no se encuentra contenido principal, usar todo el body
    if (!mainContent) {
      mainContent = document.body;
      console.log('⚠️ Usando document.body como contenido principal');
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

  async function translateFullPage() {
    if (isTranslating) {
      // Si ya está traducido, revertir
      revertTranslation();
      return;
    }

    console.log('🌐 Iniciando proceso de traducción...');

    // Preguntar al usuario a qué idioma quiere traducir
    const targetLanguage = await showLanguageSelectionDialog();
    
    if (!targetLanguage) {
      console.log('❌ Traducción cancelada por el usuario');
      return;
    }

    currentTargetLanguage = targetLanguage;
    console.log('🎯 Idioma objetivo seleccionado:', targetLanguage);

    // Cambiar el ícono del botón para indicar que está procesando
    const translateBtn = document.getElementById('ai-float-btn-translate');
    if (translateBtn) {
      translateBtn.style.background = '#FFA726'; // Color naranja para indicar procesando
      translateBtn.querySelector('div[style*="width: 24px"]').innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;">
          <circle cx="12" cy="12" r="10" opacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;
    }

    try {
      // Detectar el idioma de la página
      const pageLanguage = await detectPageLanguage();
      console.log('📄 Idioma detectado de la página:', pageLanguage);

      const detectedLang = pageLanguage.toLowerCase();
      const targetLang = targetLanguage.code.toLowerCase();

      console.log('📝 Idioma de la página:', detectedLang);

      // Verificar si la página ya está en el idioma objetivo
      // Pero permitir al usuario continuar si lo desea
      if (detectedLang === targetLang) {
        console.log('⚠️ La página parece estar en el idioma objetivo');
        
        // Crear diálogo de confirmación
        const shouldContinue = await showConfirmationDialog(
          '¿Continuar con la traducción?',
          `La página parece estar parcialmente en ${targetLanguage.name}. ¿Deseas traducir de todas formas? Esto puede ayudar a traducir contenido mixto o mal detectado.`,
          'Sí, traducir',
          'Cancelar'
        );
        
        if (!shouldContinue) {
          console.log('❌ Usuario canceló la traducción');
          if (translateBtn) {
            translateBtn.style.background = '#4285F4';
            resetTranslateButton(translateBtn);
          }
          return;
        }
        
        console.log('✅ Usuario decidió continuar con la traducción');
      }

      // Seleccionar elementos de texto de forma más inteligente
      // Estrategia: Procesar elementos "hoja" (sin hijos de texto) primero
      const allTextElements = document.querySelectorAll(`
        p, h1, h2, h3, h4, h5, h6, 
        li, td, th, 
        span, a, button, label, 
        div, section, article, 
        dt, dd, figcaption, caption,
        blockquote, q, cite,
        strong, em, b, i, u,
        small, mark, del, ins, sub, sup,
        code, pre, kbd, samp, var,
        time, address,
        [role="heading"],
        [role="text"],
        [role="paragraph"]
      `);
      
      const textsToTranslate = [];
      const elementsToTranslate = [];

      // Recopilar textos que necesitan traducción
      allTextElements.forEach(element => {
        // Evitar traducir elementos de nuestra extensión
        if (element.closest('.ai-result-panel') || 
            element.closest('.ai-float-btn') ||
            element.closest('.ai-float-buttons-container') ||
            element.closest('.ai-language-dialog') ||
            element.closest('.ai-confirmation-dialog') ||
            element.closest('[class*="ai-"]') ||
            element.closest('script') ||
            element.closest('style') ||
            element.closest('noscript') ||
            translatedElements.has(element)) {
          return;
        }

        // Verificar si el elemento tiene texto visible
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.display === 'none' || 
            computedStyle.visibility === 'hidden' ||
            computedStyle.opacity === '0') {
          return;
        }

        // Verificar si algún hijo ya fue marcado para traducción
        // Esto evita traducir el contenedor si ya traducimos los hijos
        let hasChildInList = false;
        for (let i = 0; i < elementsToTranslate.length; i++) {
          if (element.contains(elementsToTranslate[i])) {
            hasChildInList = true;
            break;
          }
        }
        if (hasChildInList) {
          return;
        }

        // Obtener TODO el texto visible del elemento usando innerText
        // innerText respeta la visibilidad CSS y el formato
        let fullText = element.innerText?.trim() || element.textContent?.trim() || '';
        
        // Filtros para evitar traducir contenido no válido
        if (!fullText || fullText.length < 2) {
          return;
        }

        // Evitar solo números, símbolos o fechas
        if (fullText.match(/^[\d\s\W]+$/) || 
            fullText.match(/^\d+$/) ||
            fullText.match(/^[^a-zA-Z]+$/)) {
          return;
        }

        // Evitar URLs y emails
        if (fullText.includes('http://') || 
            fullText.includes('https://') ||
            fullText.includes('www.') ||
            fullText.includes('@')) {
          return;
        }

        // Guardar el texto completo y el elemento
        textsToTranslate.push(fullText);
        elementsToTranslate.push(element);
      });

      if (textsToTranslate.length === 0) {
        alert('No se encontró texto para traducir en esta página');
        if (translateBtn) {
          translateBtn.style.background = '#4285F4';
          resetTranslateButton(translateBtn);
        }
        return;
      }

      console.log(`📝 ${textsToTranslate.length} elementos de texto encontrados`);

      // Mostrar notificación
      showTranslationProgress(0, textsToTranslate.length, targetLanguage.name);

      // Traducir en lotes para optimizar
      const batchSize = 5; // Reducido a 5 para mejor precisión
      let translatedCount = 0;

      for (let i = 0; i < textsToTranslate.length; i += batchSize) {
        const batch = textsToTranslate.slice(i, i + batchSize);
        const batchElements = elementsToTranslate.slice(i, i + batchSize);

        // Crear prompt para el lote con instrucciones muy claras
        const batchText = batch.map((text, idx) => `[${idx}]${text}`).join('\n');
        
        const prompt = `Eres un traductor profesional. Tu ÚNICA tarea es traducir los siguientes textos a ${targetLanguage.name}.

INSTRUCCIONES CRÍTICAS:
- Traduce TODO el texto, sin excepción
- Mantén EXACTAMENTE el formato [número] antes de cada traducción
- NO omitas ninguna línea
- NO agregues explicaciones ni comentarios
- Si un texto ya está en ${targetLanguage.name}, tradúcelo de todas formas para asegurar consistencia
- Traduce incluso palabras técnicas si tienen equivalente en ${targetLanguage.name}

TEXTOS A TRADUCIR:
${batchText}

FORMATO DE RESPUESTA REQUERIDO:
[0]texto traducido
[1]texto traducido
[2]texto traducido
etc.`;

        try {
          const translations = await AIModule.aiAnswer(prompt);
          
          // Parsear las traducciones con mejor manejo de errores
          const translationLines = translations.split('\n').filter(line => line.trim());
          
          // Procesar cada línea
          for (let lineIdx = 0; lineIdx < translationLines.length; lineIdx++) {
            const line = translationLines[lineIdx];
            
            // Buscar el patrón [número]texto
            const match = line.match(/^\[(\d+)\]\s*(.+)$/);
            if (match) {
              const idx = parseInt(match[1]);
              let translatedText = match[2].trim();
              
              if (idx < batchElements.length) {
                const element = batchElements[idx];
                const originalText = batch[idx];
                
                // Guardar texto original solo si no existe
                if (!originalTexts.has(element)) {
                  originalTexts.set(element, originalText);
                }
                
                // Estrategia de reemplazo:
                // 1. Si el elemento tiene solo texto (sin hijos HTML), usar textContent
                // 2. Si tiene hijos HTML, usar innerText para preservar estructura
                let replaced = false;
                
                try {
                  // Verificar si el elemento tiene solo texto
                  const hasOnlyText = Array.from(element.childNodes).every(
                    node => node.nodeType === Node.TEXT_NODE || 
                           (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length === 0)
                  );
                  
                  if (hasOnlyText && element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
                    // Caso simple: un solo nodo de texto
                    const node = element.childNodes[0];
                    const leadingSpace = node.textContent.match(/^\s+/)?.[0] || '';
                    const trailingSpace = node.textContent.match(/\s+$/)?.[0] || '';
                    node.textContent = leadingSpace + translatedText + trailingSpace;
                    replaced = true;
                  } else {
                    // Caso complejo: usar innerText para reemplazar todo el contenido visible
                    // Pero preservar la estructura HTML interna si es posible
                    const currentInnerText = element.innerText?.trim() || element.textContent?.trim();
                    
                    if (currentInnerText === originalText) {
                      // Si el innerText coincide exactamente, podemos reemplazar todo
                      element.innerText = translatedText;
                      replaced = true;
                    } else {
                      // Fallback: buscar y reemplazar en nodos de texto
                      const walker = document.createTreeWalker(
                        element,
                        NodeFilter.SHOW_TEXT,
                        null,
                        false
                      );
                      
                      let allText = '';
                      const textNodes = [];
                      let node;
                      
                      while (node = walker.nextNode()) {
                        const text = node.textContent.trim();
                        if (text) {
                          textNodes.push(node);
                          allText += (allText ? ' ' : '') + text;
                        }
                      }
                      
                      // Si el texto combinado coincide con el original, reemplazar el primer nodo
                      if (allText === originalText && textNodes.length > 0) {
                        const leadingSpace = textNodes[0].textContent.match(/^\s+/)?.[0] || '';
                        const trailingSpace = textNodes[textNodes.length - 1].textContent.match(/\s+$/)?.[0] || '';
                        
                        // Limpiar todos los nodos excepto el primero
                        for (let i = 1; i < textNodes.length; i++) {
                          textNodes[i].textContent = '';
                        }
                        
                        // Poner toda la traducción en el primer nodo
                        textNodes[0].textContent = leadingSpace + translatedText + trailingSpace;
                        replaced = true;
                      }
                    }
                  }
                } catch (error) {
                  console.warn('⚠️ Error al reemplazar texto:', error);
                }
                
                // Marcar como traducido solo si se reemplazó exitosamente
                if (replaced) {
                  translatedElements.add(element);
                } else {
                  console.warn('⚠️ No se pudo reemplazar:', {
                    element,
                    originalText: originalText.substring(0, 50),
                    translatedText: translatedText.substring(0, 50)
                  });
                }
              }
            }
          }

          translatedCount += batch.length;
          console.log(`✅ Traducidos ${translatedCount}/${textsToTranslate.length} elementos`);
          
          // Actualizar progreso
          showTranslationProgress(translatedCount, textsToTranslate.length, targetLanguage.name);

        } catch (error) {
          console.error('Error traduciendo lote:', error);
          // Continuar con el siguiente lote aunque haya error
        }

        // Pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log('🎉 Traducción completada');
      hideTranslationProgress();

      isTranslating = true;

      // Actualizar botón para mostrar que está traducido
      if (translateBtn) {
        translateBtn.style.background = '#4CAF50'; // Verde para indicar traducido
        translateBtn.querySelector('div[style*="width: 24px"]').innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 24px; height: 24px;">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        `;
        const tooltip = translateBtn.querySelector('.ai-float-tooltip');
        if (tooltip) tooltip.textContent = `Revertir (${targetLanguage.name})`;
      }

    } catch (error) {
      console.error('❌ Error en traducción:', error);
      alert('Error al traducir la página: ' + error.message);
      hideTranslationProgress();
      if (translateBtn) {
        translateBtn.style.background = '#4285F4';
        resetTranslateButton(translateBtn);
      }
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
              🌐 Selecciona el idioma de traducción
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
            💡 Sugerido: <strong style="color: #4285F4;">${suggestedLang.flag} ${suggestedLang.name}</strong> (idioma del sistema)
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
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border: none;
              color: white;
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

  async function detectPageLanguage() {
    // Obtener texto de muestra de la página
    const sampleTexts = [];
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    
    for (let i = 0; i < Math.min(5, elements.length); i++) {
      const text = elements[i].textContent.trim();
      if (text.length > 20) {
        sampleTexts.push(text.substring(0, 200));
      }
    }

    if (sampleTexts.length === 0) {
      // Fallback: intentar con el atributo lang
      return document.documentElement.lang || 'en';
    }

    const sampleText = sampleTexts.join(' ');

    // Usar IA para detectar el idioma
    const prompt = `Detecta el idioma del siguiente texto y responde ÚNICAMENTE con el código de idioma de 2 letras (ej: 'es' para español, 'en' para inglés, 'fr' para francés, etc.).
No agregues explicaciones, solo el código de idioma.

Texto:
${sampleText.substring(0, 500)}`;

    try {
      const detectedLang = await AIModule.aiAnswer(prompt);
      return detectedLang.trim().toLowerCase().substring(0, 2);
    } catch (error) {
      console.error('Error detectando idioma:', error);
      // Fallback al atributo lang del documento
      return (document.documentElement.lang || 'en').substring(0, 2);
    }
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
    translateBtn.querySelector('div[style*="width: 24px"]').innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 24px; height: 24px;">
        <path d="M5 8h14M5 8a2 2 0 1 1 0-4h14a2 2 0 1 1 0 4M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8"/>
        <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/>
        <path d="M7 21h10"/>
      </svg>
    `;
  }

  function revertTranslation() {
    console.log('🔄 Revirtiendo traducción...');

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

    console.log(`✅ ${revertedCount} elementos revertidos de ${originalTexts.size} totales`);

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
      translateBtn.style.background = '#4285F4';
      resetTranslateButton(translateBtn);
      const tooltip = translateBtn.querySelector('.ai-float-tooltip');
      if (tooltip) tooltip.textContent = 'Traducir Página';
    }

    console.log('✅ Traducción revertida completamente');
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

  // Agregar estilos CSS
  function addStyles() {
    if (document.getElementById('ai-float-buttons-styles')) return;

    const style = document.createElement('style');
    style.id = 'ai-float-buttons-styles';
    style.textContent = `
      @keyframes slideIn {
        to {
          opacity: 1;
          transform: scale(1) translateX(0);
        }
      }

      .ai-float-feature-btn:active {
        transform: scale(0.9) !important;
      }

      .ai-float-buttons-container {
        pointer-events: auto;
      }

      .ai-float-feature-btn {
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);
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

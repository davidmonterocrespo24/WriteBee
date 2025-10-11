const GoogleModule = (function() {
  let googlePanel = null;
  let isGoogle = false;
  let currentQuery = null;

  function init() {
    // Detectar si estamos en Google Search
    isGoogle = window.location.hostname.includes('google.com') && 
               (window.location.pathname === '/search' || window.location.search.includes('q='));
    
    if (isGoogle) {

      observeGoogle();
    }
  }

  function observeGoogle() {
    // Observar cambios en la URL (para búsquedas sin recargar página)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        onSearchChange();
      }
    }).observe(document, { subtree: true, childList: true });

    // Observador adicional para detectar cuando aparece el sidebar
    const sidebarObserver = new MutationObserver(() => {
      // Solo intentar insertar si no existe el panel y hay una query
      if (!googlePanel && getSearchQuery()) {

        insertGooglePanel();
      }
    });

    sidebarObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Verificar inmediatamente
    setTimeout(onSearchChange, 1000);
    // Reintentar después de 3 segundos por si la página tarda en cargar
    setTimeout(onSearchChange, 3000);
  }

  function onSearchChange() {
    const query = getSearchQuery();
    
    if (query && query !== currentQuery) {
      currentQuery = query;

      insertGooglePanel();
    } else if (!query && googlePanel) {
      removeGooglePanel();
      currentQuery = null;
    }
  }

  function getSearchQuery() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
  }

  function insertGooglePanel() {
    // Remover panel anterior si existe
    removeGooglePanel();

    // Crear panel de AI (siempre flotante a la derecha)
    googlePanel = document.createElement('div');
    googlePanel.className = 'ai-google-panel';
    googlePanel.innerHTML = `
      <div class="ai-google-header">
        <div class="ai-google-icon">
          <div class="ai-avatar" style="width: 24px; height: 24px; font-size: 12px;">
            <div class="eyes"><span></span><span></span></div>
          </div>
        </div>
        <div class="ai-google-title">
          <strong>Asistente AI</strong>
          <span>Analiza los resultados</span>
        </div>
        <button class="ai-google-toggle" aria-label="Expandir/Contraer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>

      <div class="ai-google-content">
        <div class="ai-google-actions">
          <button class="ai-google-action-btn summary-btn">
            <div class="ai-google-btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12h6M9 16h6M9 8h6"/>
                <rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
            </div>
            <div class="ai-google-btn-content">
              <strong>Resumen de Búsqueda</strong>
              <span>Resume el primer resultado</span>
            </div>
          </button>

          <button class="ai-google-action-btn mindmap-btn">
            <div class="ai-google-btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="2"/>
                <circle cx="6" cy="6" r="2"/>
                <circle cx="18" cy="6" r="2"/>
                <circle cx="6" cy="18" r="2"/>
                <circle cx="18" cy="18" r="2"/>
                <path d="M10 10L8 8M14 10l2-2M10 14l-2 2M14 14l2 2"/>
              </svg>
            </div>
            <div class="ai-google-btn-content">
              <strong>Mapa Mental</strong>
              <span>Organiza conceptos clave</span>
            </div>
          </button>

          <button class="ai-google-action-btn insights-btn">
            <div class="ai-google-btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div class="ai-google-btn-content">
              <strong>Insights</strong>
              <span>Puntos principales</span>
            </div>
          </button>
        </div>

        <div class="ai-google-result" style="display: none;">
          <div class="ai-google-result-header">
            <span class="ai-google-result-title">Resultado:</span>
            <div class="ai-google-result-actions">
              <button class="ai-google-copy-btn" title="Copiar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                  <rect x="5" y="5" width="10" height="10" rx="2"></rect>
                </svg>
              </button>
              <button class="ai-google-close-result-btn" title="Cerrar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="ai-google-source-info"></div>
          <div class="ai-google-result-content"></div>
        </div>
      </div>
    `;

    // Insertar el panel en el body (flotante a la derecha)
    document.body.appendChild(googlePanel);

    setupGooglePanelEvents(googlePanel);
    
    // Activar automáticamente el resumen al aparecer el panel
    setTimeout(() => {
      const summaryBtn = googlePanel.querySelector('.summary-btn');
      
      if (summaryBtn) {

        summaryBtn.click();
      }
    }, 500); // Pequeño delay para asegurar que todo esté configurado
  }

  function createFloatingSidebar() {

    // Crear panel de AI flotante
    googlePanel = document.createElement('div');
    googlePanel.className = 'ai-google-panel ai-google-panel-floating';
    googlePanel.innerHTML = `
      <div class="ai-google-header">
        <div class="ai-google-icon">
          <div class="ai-avatar" style="width: 24px; height: 24px; font-size: 12px;">
            <div class="eyes"><span></span><span></span></div>
          </div>
        </div>
        <div class="ai-google-title">
          <strong>Asistente AI</strong>
          <span>Analiza los resultados</span>
        </div>
        <button class="ai-google-toggle" aria-label="Expandir/Contraer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>

      <div class="ai-google-content">
        <div class="ai-google-actions">
          <button class="ai-google-action-btn summary-btn">
            <div class="ai-google-btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 12h6M9 16h6M9 8h6"/>
                <rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
            </div>
            <div class="ai-google-btn-content">
              <strong>Resumen de Búsqueda</strong>
              <span>Resume el primer resultado</span>
            </div>
          </button>

          <button class="ai-google-action-btn mindmap-btn">
            <div class="ai-google-btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="2"/>
                <circle cx="6" cy="6" r="2"/>
                <circle cx="18" cy="6" r="2"/>
                <circle cx="6" cy="18" r="2"/>
                <circle cx="18" cy="18" r="2"/>
                <path d="M10 10L8 8M14 10l2-2M10 14l-2 2M14 14l2 2"/>
              </svg>
            </div>
            <div class="ai-google-btn-content">
              <strong>Mapa Mental</strong>
              <span>Organiza conceptos clave</span>
            </div>
          </button>

          <button class="ai-google-action-btn insights-btn">
            <div class="ai-google-btn-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <div class="ai-google-btn-content">
              <strong>Insights</strong>
              <span>Puntos principales</span>
            </div>
          </button>
        </div>

        <div class="ai-google-result" style="display: none;">
          <div class="ai-google-result-header">
            <span class="ai-google-result-title">Resultado:</span>
            <div class="ai-google-result-actions">
              <button class="ai-google-copy-btn" title="Copiar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                  <rect x="5" y="5" width="10" height="10" rx="2"></rect>
                </svg>
              </button>
              <button class="ai-google-close-result-btn" title="Cerrar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="ai-google-source-info"></div>
          <div class="ai-google-result-content"></div>
        </div>
      </div>
    `;

    // Insertar en el body
    document.body.appendChild(googlePanel);

    setupGooglePanelEvents(googlePanel);
  }

  function removeGooglePanel() {
    if (googlePanel) {
      googlePanel.remove();
      googlePanel = null;
    }
  }

  function setupGooglePanelEvents(panel) {
    // Toggle expandir/contraer
    const toggleBtn = panel.querySelector('.ai-google-toggle');
    const content = panel.querySelector('.ai-google-content');
    let isExpanded = true;

    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      content.style.display = isExpanded ? 'block' : 'none';
      toggleBtn.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
    });

    const summaryBtn = panel.querySelector('.summary-btn');
    const mindmapBtn = panel.querySelector('.mindmap-btn');
    const insightsBtn = panel.querySelector('.insights-btn');
    const resultDiv = panel.querySelector('.ai-google-result');
    const resultContent = panel.querySelector('.ai-google-result-content');
    const sourceInfo = panel.querySelector('.ai-google-source-info');
    const copyBtn = panel.querySelector('.ai-google-copy-btn');
    const closeResultBtn = panel.querySelector('.ai-google-close-result-btn');

    // Botón resumen
    summaryBtn.addEventListener('click', async () => {
      await processSearchResult('summary', summaryBtn, resultDiv, resultContent, sourceInfo);
    });

    // Botón mapa mental
    mindmapBtn.addEventListener('click', async () => {
      await processSearchResult('mindmap', mindmapBtn, resultDiv, resultContent, sourceInfo);
    });

    // Botón insights
    insightsBtn.addEventListener('click', async () => {
      await processSearchResult('insights', insightsBtn, resultDiv, resultContent, sourceInfo);
    });

    // Botón copiar
    copyBtn.addEventListener('click', () => {
      const text = resultContent.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span style="font-size: 12px;">✓</span>';
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
      });
    });

    // Botón cerrar resultado
    closeResultBtn.addEventListener('click', () => {
      resultDiv.style.display = 'none';
    });
  }

  async function processSearchResult(type, btn, resultDiv, resultContent, sourceInfo) {
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<div style="opacity: 0.6;">Procesando...</div>';
    resultDiv.style.display = 'none';

    try {
      // Obtener el primer resultado de búsqueda
      const firstResult = await getFirstSearchResult();
      
      if (!firstResult) {
        throw new Error('No se pudo obtener el primer resultado de búsqueda');
      }

      // Mostrar información de la fuente
      sourceInfo.innerHTML = `
        <div style="font-size: 12px; color: #333; margin-bottom: 12px; padding: 8px; background: #e8e8e8; border-radius: 6px; border: 1px solid #ccc; max-width: 100%; overflow: hidden;">
          <strong>Fuente:</strong> <span style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;" title="${firstResult.title}">${firstResult.title}</span>
          <a href="${firstResult.url}" target="_blank" style="color: #1a73e8; text-decoration: none; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px;" title="${firstResult.url}">${firstResult.url}</a>
        </div>
      `;

      btn.innerHTML = '<div style="opacity: 0.6;">Generando...</div>';

      let result = '';
      const titleText = resultDiv.querySelector('.ai-google-result-title');

      switch (type) {
        case 'summary':
          titleText.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M9 12h6M9 16h6M9 8h6"/><rect x="4" y="4" width="16" height="16" rx="2"/></svg> Resumen:';
          result = await generateSummary(firstResult);
          break;
        case 'mindmap':
          titleText.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="2"/><circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/><path d="M10 10L8 8M14 10l2-2M10 14l-2 2M14 14l2 2"/></svg> Mapa Mental:';
          result = await generateMindMap(firstResult);
          break;
        case 'insights':
          titleText.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="3"/></svg> Insights:';
          result = await generateInsights(firstResult);
          break;
      }

      // Renderizar el resultado en markdown
      MarkdownRenderer.renderToElement(resultContent, result);
      resultDiv.style.display = 'block';

    } catch (error) {
      console.error('Error procesando resultado:', error);
      resultContent.innerHTML = `
        <div style="color: #ff6b6b; padding: 12px; background: #fff5f5; border-radius: 6px; border-left: 3px solid #ff6b6b;">
          <strong><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg> Error:</strong> ${error.message}
        </div>
      `;
      resultDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  }

  async function getFirstSearchResult() {
    try {

      // Múltiples selectores para diferentes versiones de Google
      const selectors = [
        '.g',
        'div[data-hveid]',
        'div[data-sokoban-container]',
        '.Gx5Zad',
        '.tF2Cxc',
        'div.yuRUbf',
        'div[jscontroller]'
      ];

      let searchResults = [];
      
      // Intentar con cada selector
      for (const selector of selectors) {
        searchResults = document.querySelectorAll(selector);
        if (searchResults.length > 0) {

          break;
        }
      }

      if (searchResults.length === 0) {

        throw new Error('No se encontraron resultados de búsqueda en la página');
      }

      // Buscar en los resultados
      for (const result of searchResults) {
        // Buscar el link principal - usando los selectores del ejemplo que diste
        const link = result.querySelector('a[jsname="UWckNb"]') ||
                     result.querySelector('a.zReHs') ||
                     result.querySelector('a[href]') || 
                     result.querySelector('a[jsname]') ||
                     result.querySelector('.yuRUbf a');
        
        // Buscar el título - clase LC20lb del ejemplo
        const titleElement = result.querySelector('h3.LC20lb') ||
                            result.querySelector('h3.MBeuO') ||
                            result.querySelector('h3.DKV0Md') ||
                            result.querySelector('h3') || 
                            result.querySelector('.LC20lb');
        
        // Buscar el snippet/descripción
        const snippetElement = result.querySelector('.VwiC3b') || 
                              result.querySelector('.yXK7lf') || 
                              result.querySelector('.s3v9rd') ||
                              result.querySelector('.lEBKkf') ||
                              result.querySelector('.IsZvec') ||
                              result.querySelector('.aCOpRe') ||
                              result.querySelector('div[data-sncf]');
        
        if (link && titleElement) {
          let url = link.href;
          const title = titleElement.innerText || titleElement.textContent;
          const snippet = snippetElement ? (snippetElement.innerText || snippetElement.textContent) : '';

          // Limpiar URL de Google Translate si existe
          if (url.includes('translate.google.com/translate')) {
            const urlMatch = url.match(/url=([^&]+)/);
            if (urlMatch) {
              url = decodeURIComponent(urlMatch[1]);

            }
          }

          // Verificar que no sea un anuncio, mapa, o resultado especial de Google
          if (url && 
              url.startsWith('http') && 
              !url.includes('google.com/search') &&
              !url.includes('google.com/maps') &&
              !url.includes('accounts.google.com') &&
              !result.querySelector('[data-text-ad]') &&
              !result.classList.contains('ads-ad') &&
              title.length > 0) {

            // Intentar obtener el contenido completo de la página
            const content = await fetchPageContent(url, snippet);
            
            return {
              title,
              url,
              snippet,
              content: content || snippet
            };
          }
        }
      }

      throw new Error('No se encontraron resultados de búsqueda válidos (solo anuncios o resultados especiales)');
    } catch (error) {
      console.error('Error obteniendo primer resultado:', error);
      throw error;
    }
  }

  async function fetchPageContent(url, fallbackSnippet) {
    try {

      // Intentar fetch (puede fallar por CORS)
      const response = await fetch(url, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      // Parsear el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Remover elementos no deseados
      doc.querySelectorAll('script, style, nav, header, footer, aside, iframe, noscript').forEach(el => el.remove());
      
      // Intentar extraer el contenido principal con múltiples selectores
      const contentSelectors = [
        'article',
        'main',
        '[role="main"]',
        '.content',
        '#content',
        '.post-content',
        '.article-content',
        '.entry-content',
        'body'
      ];
      
      let contentElement = null;
      for (const selector of contentSelectors) {
        contentElement = doc.querySelector(selector);
        if (contentElement) {

          break;
        }
      }
      
      if (contentElement) {
        const text = contentElement.innerText || contentElement.textContent;
        const cleanText = text.trim().replace(/\s+/g, ' ');

  // Limit to 8000 characters to not overload the AI
  return cleanText.substring(0, 8000);
      }
      
      throw new Error('No se pudo extraer contenido');
      
    } catch (error) {


      // Si falla, usar el snippet de Google que es más largo
      return fallbackSnippet || 'No se pudo obtener el contenido';
    }
  }

  async function generateSummary(result) {
    const prompt = `Título: ${result.title}

Contenido:
${result.content}

Resume este contenido de manera clara y concisa, destacando los puntos más importantes.`;

    return await AIModule.aiSummarize(prompt);
  }

  async function generateMindMap(result) {
    const prompt = `Título: ${result.title}

Contenido:
${result.content}

Crea un mapa mental en formato markdown que organice los conceptos principales de este contenido. Usa encabezados, listas y sub-listas para representar la jerarquía de ideas. Incluye emojis para hacer más visual el mapa mental.`;

    return await AIModule.aiAnswer(prompt);
  }

  async function generateInsights(result) {
    const prompt = `Título: ${result.title}

Contenido:
${result.content}

Extrae los insights (puntos clave, conclusiones importantes, datos relevantes) de este contenido. Organiza la información en puntos claros y concisos en formato markdown.`;

    return await AIModule.aiAnswer(prompt);
  }

  async function summarizeResults() {

    const results = getSearchResults();
    
    if (results.length === 0) {
      alert('No se encontraron resultados para resumir');
      return;
    }
    
    // Crear diálogo de resumen
    const dialog = createResultsSummaryDialog(results);
    document.body.appendChild(dialog);
    
    // Generar resumen
    await generateResultsSummary(dialog, results.slice(0, 4));
  }

  function createResultsSummaryDialog(results) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel';
    dialog.dataset.pinned = 'true';
    
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.width = 'min(800px, 95vw)';
    dialog.style.maxHeight = '90vh';
    
    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="Resumen de Google">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">Resumen de los Primeros 4 Resultados</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>
      
      <div class="ai-result-body" style="max-height: calc(90vh - 60px); overflow-y: auto;">
        <div class="ai-gmail-section">
          <div class="ai-gmail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Resumen Consolidado</span>
          </div>
          <div class="ai-google-summary-content">
            <div style="color: #a5a7b1; text-align: center; padding: 40px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.5;">
                <circle cx="12" cy="12" r="10" opacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </path>
              </svg>
              <div>Analizando resultados de búsqueda...</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Hacer arrastrable
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
    
    // Eventos
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => dialog.remove());
    
    return dialog;
  }

  async function generateResultsSummary(dialog, results) {
    const summaryContent = dialog.querySelector('.ai-google-summary-content');
    
    try {
      const resultsText = results.map((result, index) => {
        return `Resultado ${index + 1}:
Título: ${result.title}
URL: ${result.url}
Contenido: ${result.content}
---`;
      }).join('\n\n');
      
      const prompt = `Analiza los siguientes ${results.length} resultados de búsqueda de Google y genera un resumen consolidado que incluya:

1. **Resumen General**: Una síntesis de la información más relevante
2. **Puntos Clave**: Los datos más importantes encontrados
3. **Conclusiones**: Qué podemos concluir de estos resultados
4. **Recomendaciones**: Si aplica, qué acción tomar basándose en la información

Resultados de búsqueda:

${resultsText}

Genera un resumen claro, bien estructurado y útil en español.`;

      const summary = await AIModule.aiAnswer(prompt, (percent) => {
        summaryContent.innerHTML = `
          <div style="color: #a5a7b1; text-align: center; padding: 40px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.5;">
              <circle cx="12" cy="12" r="10" opacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
              </path>
            </svg>
            <div>Analizando resultados... ${percent}%</div>
          </div>
        `;
      });
      
      MarkdownRenderer.renderToElement(summaryContent, summary);
      
    } catch (error) {
      summaryContent.innerHTML = `
        <div style="color: #ff6b6b; padding: 20px; text-align: center;">
          <div>Error al generar resumen: ${error.message}</div>
        </div>
      `;
    }
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API pública
  const publicAPI = {
    init,
    summarizeResults
  };

  // Hacer disponible globalmente
  window.GoogleModule = publicAPI;

  return publicAPI;
})();



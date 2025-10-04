const GoogleModule = (function() {
  let googlePanel = null;
  let isGoogle = false;
  let currentQuery = null;

  function init() {
    // Detectar si estamos en Google Search
    isGoogle = window.location.hostname.includes('google.com') && 
               (window.location.pathname === '/search' || window.location.search.includes('q='));
    
    if (isGoogle) {
      console.log('🔍 Google Search detectado, iniciando módulo...');
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

    // Verificar inmediatamente
    setTimeout(onSearchChange, 1000);
  }

  function onSearchChange() {
    const query = getSearchQuery();
    
    if (query && query !== currentQuery) {
      currentQuery = query;
      console.log('🔍 Nueva búsqueda detectada:', query);
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

    // Crear panel de AI
    googlePanel = document.createElement('div');
    googlePanel.className = 'ai-google-panel ai-google-panel-fixed';
    googlePanel.innerHTML = `
      <div class="ai-google-header">
        <div class="ai-google-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
        </div>
        <div class="ai-google-title">
          <strong>Asistente AI</strong>
          <span>Analiza los resultados</span>
        </div>
      </div>

      <div class="ai-google-content">
        <div class="ai-google-info">
          💡 Usa IA para analizar los resultados de búsqueda
        </div>

        <div class="ai-google-actions">
          <button class="ai-google-action-btn summary-btn">
            <div class="ai-google-btn-icon">📄</div>
            <div class="ai-google-btn-content">
              <strong>Resumen de Búsqueda</strong>
              <span>Resume el primer resultado</span>
            </div>
          </button>

          <button class="ai-google-action-btn mindmap-btn">
            <div class="ai-google-btn-icon">🧠</div>
            <div class="ai-google-btn-content">
              <strong>Mapa Mental</strong>
              <span>Organiza conceptos clave</span>
            </div>
          </button>

          <button class="ai-google-action-btn insights-btn">
            <div class="ai-google-btn-icon">💡</div>
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

    // Simplemente agregar el panel al body - usará position: fixed con CSS
    document.body.appendChild(googlePanel);
    console.log('✅ Panel de Google insertado (fixed position)');
    
    setupGooglePanelEvents(googlePanel);
  }

  function removeGooglePanel() {
    if (googlePanel) {
      googlePanel.remove();
      googlePanel = null;
    }
  }

  function setupGooglePanelEvents(panel) {
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
        <div style="font-size: 12px; color: #5f6368; margin-bottom: 12px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
          <strong>Fuente:</strong> ${firstResult.title}<br>
          <a href="${firstResult.url}" target="_blank" style="color: #1a73e8; text-decoration: none;">${firstResult.url}</a>
        </div>
      `;

      btn.innerHTML = '<div style="opacity: 0.6;">Generando...</div>';

      let result = '';
      const titleText = resultDiv.querySelector('.ai-google-result-title');

      switch (type) {
        case 'summary':
          titleText.textContent = '📄 Resumen:';
          result = await generateSummary(firstResult);
          break;
        case 'mindmap':
          titleText.textContent = '🧠 Mapa Mental:';
          result = await generateMindMap(firstResult);
          break;
        case 'insights':
          titleText.textContent = '💡 Insights:';
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
          <strong>❌ Error:</strong> ${error.message}
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
      console.log('🔍 Buscando primer resultado de búsqueda...');
      
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
          console.log(`✅ Encontrados ${searchResults.length} resultados con selector: ${selector}`);
          break;
        }
      }

      if (searchResults.length === 0) {
        console.log('⚠️ No se encontraron resultados con selectores comunes');
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
              console.log('🔄 URL limpiada de Google Translate:', url);
            }
          }

          console.log('📍 Candidato encontrado:', { url: url.substring(0, 50), title: title.substring(0, 50) });

          // Verificar que no sea un anuncio, mapa, o resultado especial de Google
          if (url && 
              url.startsWith('http') && 
              !url.includes('google.com/search') &&
              !url.includes('google.com/maps') &&
              !url.includes('accounts.google.com') &&
              !result.querySelector('[data-text-ad]') &&
              !result.classList.contains('ads-ad') &&
              title.length > 0) {
            
            console.log('✅ Primer resultado válido encontrado:', title);
            
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
      console.log('🌐 Intentando obtener contenido de:', url);
      
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
          console.log(`✅ Contenido encontrado con selector: ${selector}`);
          break;
        }
      }
      
      if (contentElement) {
        const text = contentElement.innerText || contentElement.textContent;
        const cleanText = text.trim().replace(/\s+/g, ' ');
        console.log(`✅ Contenido obtenido: ${cleanText.length} caracteres`);
        
        // Limitar a 8000 caracteres para no sobrecargar la IA
        return cleanText.substring(0, 8000);
      }
      
      throw new Error('No se pudo extraer contenido');
      
    } catch (error) {
      console.log('⚠️ No se pudo obtener contenido completo (CORS o error):', error.message);
      console.log('📝 Usando snippet de Google como fallback');
      
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

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init
  };
})();

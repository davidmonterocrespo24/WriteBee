const GoogleModule = (function() {
  let googlePanel = null;
  let isGoogle = false;
  let currentQuery = null;

  function init() {
    // Detect if we're on Google Search
    isGoogle = window.location.hostname.includes('google.com') && 
               (window.location.pathname === '/search' || window.location.search.includes('q='));
    
    if (isGoogle) {

      observeGoogle();
    }
  }

  function observeGoogle() {
    // Observe URL changes (for searches without page reload)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        onSearchChange();
      }
    }).observe(document, { subtree: true, childList: true });

    // Additional observer to detect when sidebar appears
    const sidebarObserver = new MutationObserver(() => {
      // Only try to insert if panel doesn't exist and there's a query
      if (!googlePanel && getSearchQuery()) {

        insertGooglePanel();
      }
    });

    sidebarObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Check immediately
    setTimeout(onSearchChange, 1000);
    // Retry after 3 seconds in case page takes time to load
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
          <strong>WriteBee</strong>
          <span>Analyze results</span>
        </div>
        <button class="ai-google-toggle" aria-label="Expand/Collapse">
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
              <span>Summarize first result</span>
            </div>
          </button>
        </div>

        <div class="ai-google-result" style="display: none;">
          <div class="ai-google-result-header">
            <span class="ai-google-result-title">Result:</span>
            <div class="ai-google-result-actions">
              <button class="ai-google-copy-btn" title="Copy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                  <rect x="5" y="5" width="10" height="10" rx="2"></rect>
                </svg>
              </button>
              <button class="ai-google-close-result-btn" title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="ai-google-source-info"></div>
          <div class="ai-google-result-content"></div>
          <div class="ai-google-result-actions-bottom">
            <button class="ai-google-action-btn-bottom copy-result-btn" title="Copy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
            </button>
            <button class="ai-google-action-btn-bottom speak-result-btn" title="Speak">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            </button>
            <button class="ai-google-action-btn-bottom regenerate-btn" title="Regenerate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>
            <button class="ai-google-action-btn-bottom continue-chat-btn" title="Continue in chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
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
          <strong>AI Assistant</strong>
          <span>Analyze results</span>
        </div>
        <button class="ai-google-toggle" aria-label="Expand/Collapse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>

      <div class="ai-google-content">       

        <div class="ai-google-result" style="display: none;">
          <div class="ai-google-result-header">
            <span class="ai-google-result-title">Result:</span>
            <div class="ai-google-result-actions">
              <button class="ai-google-copy-btn" title="Copy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                  <rect x="5" y="5" width="10" height="10" rx="2"></rect>
                </svg>
              </button>
              <button class="ai-google-close-result-btn" title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="ai-google-source-info"></div>
          <div class="ai-google-result-content"></div>
          <div class="ai-google-result-actions-bottom">
            <button class="ai-google-action-btn-bottom copy-result-btn" title="Copy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
            </button>
            <button class="ai-google-action-btn-bottom speak-result-btn" title="Speak">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              </svg>
            </button>
            <button class="ai-google-action-btn-bottom regenerate-btn" title="Regenerate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
            </button>
            <button class="ai-google-action-btn-bottom continue-chat-btn" title="Continue in chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          </div>
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
    const resultDiv = panel.querySelector('.ai-google-result');
    const resultContent = panel.querySelector('.ai-google-result-content');
    const sourceInfo = panel.querySelector('.ai-google-source-info');
    const copyBtn = panel.querySelector('.ai-google-copy-btn');
    const closeResultBtn = panel.querySelector('.ai-google-close-result-btn');

    // Summary button
    summaryBtn.addEventListener('click', async () => {
      await processSearchResult('summary', summaryBtn, resultDiv, resultContent, sourceInfo);
    });

    // Copy button
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

    // Close result button
    closeResultBtn.addEventListener('click', () => {
      resultDiv.style.display = 'none';
    });

    // New action buttons
    const copyResultBtn = panel.querySelector('.copy-result-btn');
    const speakResultBtn = panel.querySelector('.speak-result-btn');
    const regenerateBtn = panel.querySelector('.regenerate-btn');
    const continueChatBtn = panel.querySelector('.continue-chat-btn');

    // Copy result button
    if (copyResultBtn) {
      copyResultBtn.addEventListener('click', () => {
        const text = resultContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
          const originalHTML = copyResultBtn.innerHTML;
          copyResultBtn.innerHTML = '<span style="font-size: 12px;">✓</span>';
          setTimeout(() => {
            copyResultBtn.innerHTML = originalHTML;
          }, 2000);
        });
      });
    }

    // Speak result button
    if (speakResultBtn) {
      speakResultBtn.addEventListener('click', () => {
        const text = resultContent.innerText;
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(text);
          speechSynthesis.speak(utterance);
        }
      });
    }

    // Regenerate button
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        await processSearchResult('summary', regenerateBtn, resultDiv, resultContent, sourceInfo);
      });
    }

    // Continue in chat button
    if (continueChatBtn) {
      continueChatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const currentAnswer = resultContent.innerText;
        const currentAction = 'google_summary';

        try {
          chrome.runtime.sendMessage({
            action: 'openSidePanel',
            data: {
              selectedText: currentQuery,
              currentAnswer: currentAnswer,
              action: currentAction
            }
          }, (response) => {
            if (chrome.runtime.lastError) {
              alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue using the chat.');
              return;
            }

            if (response && response.success) {
              // Close the panel after opening side panel
              panel.remove();
            }
          });
        } catch (error) {
          if (error.message.includes('Extension context invalidated')) {
            alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue using the chat.');
          } else {
            alert('Error opening chat: ' + error.message);
          }
        }
      });
    }
  }

  async function processSearchResult(type, btn, resultDiv, resultContent, sourceInfo) {
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<div style="opacity: 0.6;">Processing...</div>';
    resultDiv.style.display = 'none';

    try {
      // Get the first search result
      const firstResult = await getFirstSearchResult();
      
      if (!firstResult) {
        throw new Error('Could not obtain the first search result');
      }

      // Display source information
      sourceInfo.innerHTML = `
        <div style="font-size: 12px; color: #333; margin-bottom: 12px; padding: 8px; background: #e8e8e8; border-radius: 6px; border: 1px solid #ccc; max-width: 100%; overflow: hidden;">
          <strong>Source:</strong> <span style="display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;" title="${firstResult.title}">${firstResult.title}</span>
          <a href="${firstResult.url}" target="_blank" style="color: #1a73e8; text-decoration: none; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 11px;" title="${firstResult.url}">${firstResult.url}</a>
        </div>
      `;

      btn.innerHTML = '<div style="opacity: 0.6;">Generating...</div>';

      let result = '';
      const titleText = resultDiv.querySelector('.ai-google-result-title');

      switch (type) {
        case 'summary':
          titleText.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 4px;"><path d="M9 12h6M9 16h6M9 8h6"/><rect x="4" y="4" width="16" height="16" rx="2"/></svg> Summary:';
          result = await generateSummary(firstResult);
          break;
      }

      // Render the result in markdown
      MarkdownRenderer.renderToElement(resultContent, result);
      resultDiv.style.display = 'block';

    } catch (error) {
      console.error('Error processing result:', error);
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

      // Multiple selectors for different Google versions
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
      
      // Try with each selector
      for (const selector of selectors) {
        searchResults = document.querySelectorAll(selector);
        if (searchResults.length > 0) {

          break;
        }
      }

      if (searchResults.length === 0) {

        throw new Error('No search results found on the page');
      }

      // Search through the results
      for (const result of searchResults) {
        // Find the main link - using the selectors from the example you gave
        const link = result.querySelector('a[jsname="UWckNb"]') ||
                     result.querySelector('a.zReHs') ||
                     result.querySelector('a[href]') || 
                     result.querySelector('a[jsname]') ||
                     result.querySelector('.yuRUbf a');
        
        // Find the title - LC20lb class from the example
        const titleElement = result.querySelector('h3.LC20lb') ||
                            result.querySelector('h3.MBeuO') ||
                            result.querySelector('h3.DKV0Md') ||
                            result.querySelector('h3') || 
                            result.querySelector('.LC20lb');
        
        // Find the snippet/description
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

          // Clean Google Translate URL if it exists
          if (url.includes('translate.google.com/translate')) {
            const urlMatch = url.match(/url=([^&]+)/);
            if (urlMatch) {
              url = decodeURIComponent(urlMatch[1]);

            }
          }

          // Verify it's not an ad, map, or special Google result
          if (url && 
              url.startsWith('http') && 
              !url.includes('google.com/search') &&
              !url.includes('google.com/maps') &&
              !url.includes('accounts.google.com') &&
              !result.querySelector('[data-text-ad]') &&
              !result.classList.contains('ads-ad') &&
              title.length > 0) {

            // Try to get the full page content
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

      throw new Error('No valid search results found (only ads or special results)');
    } catch (error) {
      console.error('Error getting first result:', error);
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
      
      // Parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Remove unwanted elements
      doc.querySelectorAll('script, style, nav, header, footer, aside, iframe, noscript').forEach(el => el.remove());
      
      // Try to extract main content with multiple selectors
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
      
      throw new Error('Could not extract content');
      
    } catch (error) {


      // If it fails, use the longer Google snippet
      return fallbackSnippet || 'Could not obtain content';
    }
  }

  async function generateSummary(result) {
    const prompt = `Título: ${result.title}

Contenido:
${result.content}

Summarize this content clearly and concisely, highlighting the most important points.`;

    return await AIModule.aiSummarize(prompt);
  }

  async function summarizeResults() {

    const results = getSearchResults();
    
    if (results.length === 0) {
      alert('No results found to summarize');
      return;
    }
    
    // Create summary dialog
    const dialog = createResultsSummaryDialog(results);
    document.body.appendChild(dialog);
    
    // Generate summary
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
        <div class="title">Summary of First 4 Results</div>
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
            <span>Consolidated Summary</span>
          </div>
          <div class="ai-google-summary-content">
            <div style="color: #a5a7b1; text-align: center; padding: 40px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.5;">
                <circle cx="12" cy="12" r="10" opacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </path>
              </svg>
              <div>Analyzing search results...</div>
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
    
    // Events
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => dialog.remove());
    
    return dialog;
  }

  async function generateResultsSummary(dialog, results) {
    const summaryContent = dialog.querySelector('.ai-google-summary-content');
    
    try {
      const resultsText = results.map((result, index) => {
        return `Result ${index + 1}:
Title: ${result.title}
URL: ${result.url}
Content: ${result.content}
---`;
      }).join('\n\n');
      
      const prompt = `Analyze the following ${results.length} Google search results and generate a consolidated summary that includes:

1. **General Summary**: A synthesis of the most relevant information
2. **Key Points**: The most important data found
3. **Conclusions**: What we can conclude from these results
4. **Recommendations**: If applicable, what action to take based on the information

Search results:

${resultsText}

Generate a clear, well-structured and useful summary in English.`;

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

  // Make available globally
  window.GoogleModule = publicAPI;

  return publicAPI;
})();



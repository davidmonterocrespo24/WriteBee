const ToolbarModule = (function() {
  let toolbar = null;
  let selectedText = '';

  function getSelectedText() {
    return selectedText;
  }

  function setSelectedText(text) {
    selectedText = text;
  }

  function getToolbar() {
    return toolbar;
  }

  async function showToolbar(pageX, pageY, clientX, clientY, text) {
    if (toolbar) toolbar.remove();

    selectedText = text;
    toolbar = document.createElement('div');
    toolbar.className = 'ai-toolbar';
    toolbar.style.left = pageX + 'px';
    toolbar.style.top = (pageY - 50) + 'px';

    // Guardar posición del viewport (clientY) para el diálogo, no pageY
    toolbar.dataset.selectionY = clientY;
    console.log('🎯 Toolbar posicionado en - pageX:', pageX, 'pageY:', pageY, 'clientY guardado:', clientY);

    // Load pinned actions from config
    const pinnedActions = await ToolbarConfigModule.getPinnedActions();

    // Build toolbar buttons HTML
    const buttonsHTML = pinnedActions.map(action => {
      const className = action.className ? `ai-tool ${action.className}` : 'ai-tool';
      return `<button class="${className}" data-action="${action.id}" aria-label="${action.label}" title="${action.label}">${action.icon}</button>`;
    }).join('\n');

    toolbar.innerHTML = `
      ${buttonsHTML}

      <button class="ai-tool" data-action="more" aria-label="More options">
        <svg class="ai-kebab" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="6" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="12" cy="18" r="2"/>
        </svg>
      </button>

      <div class="ai-avatar" aria-label="Profile">
        <div class="eyes"><span></span><span></span></div>
      </div>
    `;

    document.body.appendChild(toolbar);

    // Guardar la posición del toolbar inmediatamente después de agregarlo al DOM
    setTimeout(() => {
      const initialRect = toolbar.getBoundingClientRect();
      toolbar.dataset.initialLeft = initialRect.left;
      toolbar.dataset.initialTop = initialRect.top;
      toolbar.dataset.initialBottom = initialRect.bottom;
      console.log('📍 Posición inicial del toolbar guardada - left:', initialRect.left, 'top:', initialRect.top, 'bottom:', initialRect.bottom);
    }, 0);

    toolbar.querySelectorAll('[data-action]').forEach(btn => {
      // Activar la bandera en mousedown (antes del mouseup)
      btn.addEventListener('mousedown', () => {
        const action = btn.dataset.action;
        if (action !== 'more') {
          console.log('⬇️ MouseDown en toolbar');
          if (window.setIgnoreNextMouseUp) {
            console.log('🚫 Activando ignoreNextMouseUp');
            window.setIgnoreNextMouseUp();
          }
        }
      });

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;

        if (action === 'more') {
          MenusModule.showMoreMenu(btn);
        } else if (action === 'chat-with-page') {
          // Open side panel with page context
          toolbar.style.display = 'none';
          MenusModule.hideMenus(); // Close any open menus

          // Extract page content
          const pageContent = WebChatModule.extractPageContent();
          const metadata = WebChatModule.getPageMetadata();

          // Open side panel with page context
          try {
            chrome.runtime.sendMessage({
              action: 'openSidePanel',
              data: {
                webChatMode: true,
                pageTitle: metadata.title,
                pageUrl: metadata.url,
                pageContent: pageContent.substring(0, 10000),
                selectedText: selectedText // Include selected text if any
              }
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('Extension context error:', chrome.runtime.lastError);
                alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue.');
                return;
              }
              if (response && response.success) {
                console.log('✅ Side panel opened with page context');
              }
            });
          } catch (error) {
            console.error('Error sending message:', error);
            alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue.');
          }
        } else {
          console.log('🔵 Click en acción:', action);

          // Log de datos guardados
          console.log('📦 Datos guardados en toolbar:', {
            initialLeft: toolbar.dataset.initialLeft,
            initialTop: toolbar.dataset.initialTop,
            initialBottom: toolbar.dataset.initialBottom
          });

          // Log de posición actual del toolbar
          const currentRect = toolbar.getBoundingClientRect();
          console.log('📍 Posición ACTUAL del toolbar:', {
            left: currentRect.left,
            top: currentRect.top,
            bottom: currentRect.bottom
          });

          // Usar la posición inicial guardada, no la actual
          const rect = {
            left: parseFloat(toolbar.dataset.initialLeft) || currentRect.left,
            top: parseFloat(toolbar.dataset.initialTop) || currentRect.top,
            bottom: parseFloat(toolbar.dataset.initialBottom) || currentRect.bottom
          };
          console.log('🎯 Rect que se enviará al diálogo:', rect);
          console.log('📏 Viewport actual - scrollY:', window.scrollY, 'clientHeight:', window.innerHeight);

          toolbar.style.display = 'none';

          // Para traducir, usar idioma por defecto (español), el usuario puede cambiar desde el selector
          const param = action === 'translate' ? 'es' : null;
          ActionsModule.executeAction(action, param, rect, selectedText);
        }
      });
    });
  }

  function hideToolbar() {
    if (toolbar) {
      toolbar.remove();
      toolbar = null;
    }
  }

  async function refreshToolbar() {
    if (!toolbar) return;

    // Load pinned actions from config
    const pinnedActions = await ToolbarConfigModule.getPinnedActions();

    // Build toolbar buttons HTML
    const buttonsHTML = pinnedActions.map(action => {
      const className = action.className ? `ai-tool ${action.className}` : 'ai-tool';
      return `<button class="${className}" data-action="${action.id}" aria-label="${action.label}" title="${action.label}">${action.icon}</button>`;
    }).join('\n');

    // Update only the buttons, keeping the more button and avatar
    toolbar.innerHTML = `
      ${buttonsHTML}

      <button class="ai-tool" data-action="more" aria-label="More options">
        <svg class="ai-kebab" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="6" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="12" cy="18" r="2"/>
        </svg>
      </button>

      <div class="ai-avatar" aria-label="Profile">
        <div class="eyes"><span></span><span></span></div>
      </div>
    `;

    // Re-attach event listeners
    toolbar.querySelectorAll('[data-action]').forEach(btn => {
      // Activar la bandera en mousedown (antes del mouseup)
      btn.addEventListener('mousedown', () => {
        const action = btn.dataset.action;
        if (action !== 'more') {
          console.log('⬇️ MouseDown en toolbar');
          if (window.setIgnoreNextMouseUp) {
            console.log('🚫 Activando ignoreNextMouseUp');
            window.setIgnoreNextMouseUp();
          }
        }
      });

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;

        if (action === 'more') {
          MenusModule.showMoreMenu(btn);
        } else if (action === 'chat-with-page') {
          // Open side panel with page context
          toolbar.style.display = 'none';
          MenusModule.hideMenus(); // Close any open menus

          // Extract page content
          const pageContent = WebChatModule.extractPageContent();
          const metadata = WebChatModule.getPageMetadata();

          // Open side panel with page context
          try {
            chrome.runtime.sendMessage({
              action: 'openSidePanel',
              data: {
                webChatMode: true,
                pageTitle: metadata.title,
                pageUrl: metadata.url,
                pageContent: pageContent.substring(0, 10000),
                selectedText: selectedText // Include selected text if any
              }
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('Extension context error:', chrome.runtime.lastError);
                alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue.');
                return;
              }
              if (response && response.success) {
                console.log('✅ Side panel opened with page context');
              }
            });
          } catch (error) {
            console.error('Error sending message:', error);
            alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue.');
          }
        } else {
          console.log('🔵 Click en acción:', action);

          // Log de datos guardados
          console.log('📦 Datos guardados en toolbar:', {
            initialLeft: toolbar.dataset.initialLeft,
            initialTop: toolbar.dataset.initialTop,
            initialBottom: toolbar.dataset.initialBottom
          });

          // Log de posición actual del toolbar
          const currentRect = toolbar.getBoundingClientRect();
          console.log('📍 Posición ACTUAL del toolbar:', {
            left: currentRect.left,
            top: currentRect.top,
            bottom: currentRect.bottom
          });

          // Usar la posición inicial guardada, no la actual
          const rect = {
            left: parseFloat(toolbar.dataset.initialLeft) || currentRect.left,
            top: parseFloat(toolbar.dataset.initialTop) || currentRect.top,
            bottom: parseFloat(toolbar.dataset.initialBottom) || currentRect.bottom
          };
          console.log('🎯 Rect que se enviará al diálogo:', rect);
          console.log('📏 Viewport actual - scrollY:', window.scrollY, 'clientHeight:', window.innerHeight);

          toolbar.style.display = 'none';

          // Para traducir, usar idioma por defecto (español), el usuario puede cambiar desde el selector
          const param = action === 'translate' ? 'es' : null;
          ActionsModule.executeAction(action, param, rect, selectedText);
        }
      });
    });
  }

  return {
    getSelectedText,
    setSelectedText,
    getToolbar,
    showToolbar,
    hideToolbar,
    refreshToolbar
  };
})();

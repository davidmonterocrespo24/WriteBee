const MenusModule = (function() {
  let menu = null;
  let translateMenu = null;
  let draggedItem = null;

  async function showMoreMenu(button) {
    if (menu) menu.remove();

    const rect = button.getBoundingClientRect();
    menu = document.createElement('div');
    menu.className = 'ai-menu';
    // Convertir coordenadas del viewport a absolutas
    menu.style.left = (rect.left + window.scrollX) + 'px';
    menu.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    console.log('📍 Menú posicionado en:', {
      viewport: { left: rect.left, bottom: rect.bottom },
      scroll: { scrollX: window.scrollX, scrollY: window.scrollY },
      absolute: { left: rect.left + window.scrollX, top: rect.bottom + window.scrollY + 5 }
    });

    // Load ALL actions from config (both pinned and unpinned)
    const allActions = await ToolbarConfigModule.loadConfig();

    // Build menu items HTML
    const menuItems = allActions.map((action, index) => {
      const iconHTML = action.icon.includes('<svg') || action.icon.includes('<span')
        ? action.icon
        : `<span class="icon">${action.icon}</span>`;

      const pinIcon = action.pinned
        ? `<svg class="pin-filled" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`
        : `<svg class="pin-outline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`;
      const pinTitle = action.pinned ? 'Unpin from toolbar' : 'Pin to toolbar';

      return `
        <div class="ai-menu-item ${action.pinned ? 'pinned' : ''}"
             data-action="${action.id}"
             data-action-id="${action.id}"
             data-index="${index}"
             draggable="true">
          <div class="drag-handle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </div>
          <div class="menu-item-content">
            ${iconHTML}
            <span class="menu-item-label">${action.label}</span>
          </div>
          <button class="pin-menu-btn" data-action-id="${action.id}" title="${pinTitle}">${pinIcon}</button>
        </div>
      `;
    }).join('');

    menu.innerHTML = `
      <div class="menu-hint">Drag to reorder • Click pin to show/hide</div>
      ${menuItems}
    `;

    document.body.appendChild(menu);

    // Add pin button listeners
    menu.querySelectorAll('.pin-menu-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const actionId = btn.dataset.actionId;
        await ToolbarConfigModule.togglePin(actionId);

        // Refresh the toolbar
        await ToolbarModule.refreshToolbar();

        // Refresh the menu
        const moreButton = document.querySelector('[data-action="more"]');
        if (moreButton) {
          hideMenus();
          await showMoreMenu(moreButton);
        }
      });
    });

    // Add drag and drop listeners
    menu.querySelectorAll('.ai-menu-item').forEach(item => {
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);
    });

    menu.querySelectorAll('.ai-menu-item').forEach(item => {
      // Activar la bandera en mousedown (antes del mouseup)
      item.addEventListener('mousedown', (e) => {
        console.log('⬇️ MouseDown en menú');
        if (window.setIgnoreNextMouseUp) {
          console.log('🚫 Activando ignoreNextMouseUp');
          window.setIgnoreNextMouseUp();
        }
      });

      item.addEventListener('click', (e) => {
        e.stopPropagation();

        // Don't execute action if clicking on pin button
        if (e.target.classList.contains('pin-menu-btn')) {
          return;
        }

        console.log('🎯 Click en menú - acción:', item.dataset.action);

        const action = item.dataset.action;
        const toolbar = ToolbarModule.getToolbar();

        // Handle "Chat with this page" separately
        if (action === 'chat-with-page') {
          if (toolbar) toolbar.style.display = 'none';
          hideMenus(); // Close the menu

          const pageContent = WebChatModule.extractPageContent();
          const metadata = WebChatModule.getPageMetadata();

          chrome.runtime.sendMessage({
            action: 'openSidePanel',
            data: {
              webChatMode: true,
              pageTitle: metadata.title,
              pageUrl: metadata.url,
              pageContent: pageContent.substring(0, 10000),
              selectedText: ToolbarModule.getSelectedText()
            }
          });
          return;
        }

        // Usar la posición inicial guardada del toolbar, no la actual
        let rect = null;
        if (toolbar) {
          const currentRect = toolbar.getBoundingClientRect();
          rect = {
            left: parseFloat(toolbar.dataset.initialLeft) || currentRect.left,
            top: parseFloat(toolbar.dataset.initialTop) || currentRect.top,
            bottom: parseFloat(toolbar.dataset.initialBottom) || currentRect.bottom
          };
          console.log('🎯 Rect para diálogo desde menú:', rect);
          toolbar.style.display = 'none';
        }

        // Para traducir, usar idioma por defecto (español), el usuario puede cambiar desde el selector
        const param = action === 'translate' ? 'es' : null;
        ActionsModule.executeAction(action, param, rect, ToolbarModule.getSelectedText());
      });
    });
  }

  function showTranslateMenu(button) {
    if (translateMenu) translateMenu.remove();

    const rect = button.getBoundingClientRect();
    translateMenu = document.createElement('div');
    translateMenu.className = 'ai-translate-menu';
    // Convertir coordenadas del viewport a absolutas
    translateMenu.style.left = (rect.right + window.scrollX + 5) + 'px';
    translateMenu.style.top = (rect.top + window.scrollY) + 'px';

    const languages = [
      { code: 'es', name: 'Español' },
      { code: 'en', name: 'English' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'it', name: 'Italiano' },
      { code: 'pt', name: 'Português' },
      { code: 'ja', name: '日本語' },
      { code: 'zh', name: '中文' }
    ];

    translateMenu.innerHTML = languages.map(lang =>
      `<div class="ai-translate-item" data-lang="${lang.code}">${lang.name}</div>`
    ).join('');

    document.body.appendChild(translateMenu);

    translateMenu.querySelectorAll('[data-lang]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const toolbar = ToolbarModule.getToolbar();

        // Usar la posición inicial guardada del toolbar, no la actual
        let rect = null;
        if (toolbar) {
          const currentRect = toolbar.getBoundingClientRect();
          rect = {
            left: parseFloat(toolbar.dataset.initialLeft) || currentRect.left,
            top: parseFloat(toolbar.dataset.initialTop) || currentRect.top,
            bottom: parseFloat(toolbar.dataset.initialBottom) || currentRect.bottom
          };
          toolbar.style.display = 'none';
        }

        ActionsModule.executeAction('translate', item.dataset.lang, rect, ToolbarModule.getSelectedText());
      });
    });
  }

  // Drag and drop handlers
  function handleDragStart(e) {
    draggedItem = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';

    const target = e.currentTarget;
    if (target !== draggedItem && target.classList.contains('ai-menu-item')) {
      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (e.clientY < midY) {
        target.parentNode.insertBefore(draggedItem, target);
      } else {
        target.parentNode.insertBefore(draggedItem, target.nextSibling);
      }
    }

    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    return false;
  }

  async function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');

    // Get new order
    const items = Array.from(menu.querySelectorAll('.ai-menu-item'));
    const newOrder = items.map(item => item.dataset.actionId);

    // Save new order
    await ToolbarConfigModule.reorderActions(newOrder);

    // Refresh the toolbar to show new order
    await ToolbarModule.refreshToolbar();

    draggedItem = null;
  }

  function hideMenus() {
    if (menu) {
      menu.remove();
      menu = null;
    }
    if (translateMenu) {
      translateMenu.remove();
      translateMenu = null;
    }
  }

  function getMenu() {
    return menu;
  }

  function getTranslateMenu() {
    return translateMenu;
  }

  return {
    showMoreMenu,
    showTranslateMenu,
    hideMenus,
    getMenu,
    getTranslateMenu
  };
})();

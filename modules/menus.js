const MenusModule = (function() {
  let menu = null;
  let translateMenu = null;

  function showMoreMenu(button) {
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

    menu.innerHTML = `
      <div class="ai-menu-item" data-action="summarize">
        <span class="icon">📄</span>
        Resumir
        <span class="pin">📌</span>
      </div>
      <div class="ai-menu-item" data-action="translate">
        <span class="icon">🌐</span>
        Traducir a: <small>español</small>
        <span class="pin">📌</span>
      </div>
      <div class="ai-menu-item" data-action="explain">
        <span class="icon">💡</span>
        Explicar esto
      </div>
      <div class="ai-menu-item" data-action="grammar">
        <span class="icon">📚</span>
        Gramática
      </div>
      <div class="ai-menu-item" data-action="rewrite">
        <span class="icon">✏️</span>
        Reescribir
      </div>
      <div class="ai-menu-item" data-action="expand">
        <span class="icon">🔍</span>
        Expandir
      </div>
      <div class="ai-menu-item" data-action="answer">
        <span class="icon">💬</span>
        Responder a esta pregunta
      </div>
    `;

    document.body.appendChild(menu);

    menu.querySelectorAll('[data-action]').forEach(item => {
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
        console.log('🎯 Click en menú - acción:', item.dataset.action);

        const action = item.dataset.action;
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

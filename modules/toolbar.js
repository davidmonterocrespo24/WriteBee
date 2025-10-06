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

  function showToolbar(pageX, pageY, clientX, clientY, text) {
    if (toolbar) toolbar.remove();

    selectedText = text;
    toolbar = document.createElement('div');
    toolbar.className = 'ai-toolbar';
    toolbar.style.left = pageX + 'px';
    toolbar.style.top = (pageY - 50) + 'px';

    // Guardar posición del viewport (clientY) para el diálogo, no pageY
    toolbar.dataset.selectionY = clientY;
    console.log('🎯 Toolbar posicionado en - pageX:', pageX, 'pageY:', pageY, 'clientY guardado:', clientY);

    toolbar.innerHTML = `
      <button class="ai-tool pen" data-action="rewrite" aria-label="Reescribir">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zm2.92 2.33h-.5v-.5l9.9-9.9.5.5-9.9 9.9zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75 1.13-1.13z"/>
        </svg>
      </button>

      <button class="ai-tool" data-action="summarize" aria-label="Resumir">
        <svg class="doc" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/>
          <path d="M14 2v6h6"/>
          <path d="M8 12h8M8 16h8"/>
        </svg>
      </button>

      <button class="ai-tool has-caret" data-action="translate" aria-label="Traducir">
        <svg class="translate" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M4 5h9"/>
          <path d="M8 5s.3 5-4 9"/>
          <path d="M12 9h-8"/>
          <path d="M14 19l4-10 4 10"/>
          <path d="M15.5 15h5"/>
        </svg>
      </button>

      <button class="ai-tool" data-action="more" aria-label="Más opciones">
        <svg class="ai-kebab" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="6" r="2"/>
          <circle cx="12" cy="12" r="2"/>
          <circle cx="12" cy="18" r="2"/>
        </svg>
      </button>

      <div class="ai-avatar" aria-label="Perfil">
        <div class="eyes"><span></span><span></span></div>
      </div>
    `;

    document.body.appendChild(toolbar);

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
        } else {
          const rect = toolbar.getBoundingClientRect();
          // No usar selectionY guardado, usar directamente la posición del toolbar
          console.log('🎯 Enviando rect al diálogo - left:', rect.left, 'top:', rect.top, 'bottom:', rect.bottom);
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

  return {
    getSelectedText,
    setSelectedText,
    getToolbar,
    showToolbar,
    hideToolbar
  };
})();

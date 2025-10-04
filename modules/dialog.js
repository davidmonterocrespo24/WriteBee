const DialogModule = (function() {
  const pinnedDialogs = [];

  function adjustDialogPosition(dialog, initialLeft, initialTop) {
    const rect = dialog.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let left = initialLeft;
    let top = initialTop;

    // Ajustar si se sale por la derecha
    if (left + rect.width > viewportWidth) {
      left = viewportWidth - rect.width - 10;
    }

    // Ajustar si se sale por la izquierda
    if (left < 10) {
      left = 10;
    }

    // Ajustar si se sale por abajo
    if (top + rect.height > viewportHeight) {
      top = viewportHeight - rect.height - 10;
    }

    // Ajustar si se sale por arriba
    if (top < 10) {
      top = 10;
    }

    dialog.style.left = left + 'px';
    dialog.style.top = top + 'px';
  }

  function createDialog(action, content, selectedText, toolbarRect) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel';
    dialog.dataset.pinned = 'false';
    dialog.dataset.action = action;

    let initialLeft, initialTop;

    if (toolbarRect) {
      initialLeft = toolbarRect.left;
      initialTop = toolbarRect.bottom + 10;
      dialog.style.left = initialLeft + 'px';
      dialog.style.top = initialTop + 'px';
    } else {
      dialog.style.left = '50%';
      dialog.style.top = '50%';
      dialog.style.transform = 'translate(-50%, -50%)';
    }

    const actionTitle = getActionTitle(action);

    // Agregar selector de idiomas (siempre presente, pero oculto si no es traducir)
    const languageSelector = `
      <select class="ai-lang-selector" aria-label="Seleccionar idioma" style="display: ${action === 'translate' ? 'block' : 'none'}">
        <option value="es">Español</option>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
        <option value="it">Italiano</option>
        <option value="pt">Português</option>
        <option value="ja">日本語</option>
        <option value="zh">中文</option>
      </select>
    `;

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="title">${actionTitle}</div>
        <div style="position: relative;">
          <button class="ai-iconbtn mode-dropdown-btn" aria-label="Abrir opciones">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <div class="ai-mode-dropdown">
            <div class="ai-mode-dropdown-item ${action === 'summarize' ? 'active' : ''}" data-mode="summarize">
              <span class="icon">📄</span>
              Resumir
            </div>
            <div class="ai-mode-dropdown-item ${action === 'translate' ? 'active' : ''}" data-mode="translate">
              <span class="icon">🌐</span>
              Traducir
            </div>
            <div class="ai-mode-dropdown-item ${action === 'explain' ? 'active' : ''}" data-mode="explain">
              <span class="icon">💡</span>
              Explicar
            </div>
            <div class="ai-mode-dropdown-item ${action === 'grammar' ? 'active' : ''}" data-mode="grammar">
              <span class="icon">📚</span>
              Gramática
            </div>
            <div class="ai-mode-dropdown-item ${action === 'rewrite' ? 'active' : ''}" data-mode="rewrite">
              <span class="icon">✏️</span>
              Reescribir
            </div>
            <div class="ai-mode-dropdown-item ${action === 'expand' ? 'active' : ''}" data-mode="expand">
              <span class="icon">🔍</span>
              Expandir
            </div>
            <div class="ai-mode-dropdown-item ${action === 'answer' ? 'active' : ''}" data-mode="answer">
              <span class="icon">💬</span>
              Responder
            </div>
          </div>
        </div>
        <div class="spacer"></div>
        ${languageSelector}
        <button class="ai-iconbtn pin-btn" aria-label="Fijar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 3l5 5-7 7-4 1 1-4 7-7zM2 22l6-6"/>
          </svg>
        </button>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        <div class="ai-preview">${selectedText}</div>
        <div class="ai-answer">${content}</div>
        <div class="ai-chat-history" style="display: none;"></div>
      </div>

      <div class="ai-actions">
        <div class="left">Preguntar de seguimiento</div>
        <div class="right">
          <button class="ai-iconbtn copy-btn" aria-label="Copiar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
          </button>
          <button class="ai-iconbtn regenerate-btn" aria-label="Generar de nuevo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
          <button class="ai-iconbtn edit-btn" aria-label="Editar la respuesta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="ai-iconbtn speak-btn" aria-label="Hablar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </button>
          <div class="ai-avatar" title="Perfil">
            <div class="eyes"><span></span><span></span></div>
          </div>
        </div>
      </div>

      <div class="ai-footer">
        <div class="ai-followup">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <input type="text" placeholder="Preguntar de seguimiento" />
          <button class="ai-send-btn" aria-label="Enviar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22L11 13L2 9L22 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    makeDraggable(dialog);
    setupDialogEvents(dialog, content, selectedText, action);

    // Ajustar posición después de que el diálogo esté en el DOM (se hace en actions.js)
    // Pero guardamos la función para llamarla desde fuera
    dialog.adjustPosition = function() {
      if (toolbarRect) {
        adjustDialogPosition(dialog, initialLeft, initialTop);
      }
    };

    return dialog;
  }

  function showLoadingDialog(toolbarRect) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel';
    dialog.dataset.pinned = 'false';

    if (toolbarRect) {
      dialog.style.left = toolbarRect.left + 'px';
      dialog.style.top = (toolbarRect.bottom + 10) + 'px';
    } else {
      dialog.style.left = '50%';
      dialog.style.top = '50%';
      dialog.style.transform = 'translate(-50%, -50%)';
    }

    dialog.innerHTML = `<div class="ai-loading">Procesando...</div>`;
    document.body.appendChild(dialog);

    // Método para actualizar el progreso
    dialog.updateProgress = function(percent) {
      const loadingDiv = this.querySelector('.ai-loading');
      if (loadingDiv) {
        loadingDiv.textContent = `Procesando  ${percent}%`;
      }
    };

    return dialog;
  }

  function makeDraggable(dialog) {
    const header = dialog.querySelector('.ai-draggable');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

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

  function setupDialogEvents(dialog, content, selectedText, action) {
    // Dropdown de modos
    const dropdownBtn = dialog.querySelector('.mode-dropdown-btn');
    const dropdown = dialog.querySelector('.ai-mode-dropdown');

    if (dropdownBtn && dropdown) {
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      // Cerrar dropdown al hacer click fuera
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !dropdownBtn.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });

      // Cambiar modo
      dropdown.querySelectorAll('[data-mode]').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          const newMode = item.dataset.mode;

          console.log('🔄 Cambiando modo a:', newMode);

          // Actualizar UI
          dropdown.classList.remove('show');
          dropdown.querySelectorAll('.ai-mode-dropdown-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');

          // Actualizar título
          const titleEl = dialog.querySelector('.title');
          titleEl.textContent = getActionTitle(newMode);

          // Actualizar action en dataset
          dialog.dataset.action = newMode;

          // Mostrar/ocultar selector de idiomas
          const langSelector = dialog.querySelector('.ai-lang-selector');
          if (langSelector) {
            langSelector.style.display = newMode === 'translate' ? 'block' : 'none';
          }

          // Ejecutar nueva acción
          const answerDiv = dialog.querySelector('.ai-answer');
          answerDiv.textContent = 'Procesando...';

          // Callback de progreso
          const onProgress = (percent) => {
            answerDiv.textContent = `Procesando ${percent}%`;
          };

          try {
            let result = '';
            const currentLang = langSelector ? langSelector.value : 'es';

            switch (newMode) {
              case 'summarize':
                result = await AIModule.aiSummarize(selectedText, onProgress);
                break;
              case 'translate':
                result = await AIModule.aiTranslate(selectedText, currentLang, onProgress);
                break;
              case 'explain':
                result = await AIModule.aiExplain(selectedText, onProgress);
                break;
              case 'grammar':
                result = await AIModule.aiGrammar(selectedText, onProgress);
                break;
              case 'rewrite':
                result = await AIModule.aiRewrite(selectedText, onProgress);
                break;
              case 'expand':
                result = await AIModule.aiExpand(selectedText, onProgress);
                break;
              case 'answer':
                result = await AIModule.aiAnswer(selectedText, onProgress);
                break;
            }

            MarkdownRenderer.renderToElement(answerDiv, result);
          } catch (error) {
            answerDiv.textContent = 'Error: ' + error.message;
          }
        });
      });
    }

    const closeBtn = dialog.querySelector('.close-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (dialog.dataset.pinned === 'true') {
          const index = pinnedDialogs.indexOf(dialog);
          if (index > -1) pinnedDialogs.splice(index, 1);
        }
        dialog.remove();
      });
    }

    const pinBtn = dialog.querySelector('.pin-btn');
    if (pinBtn) {
      pinBtn.addEventListener('click', () => {
        if (dialog.dataset.pinned === 'false') {
          dialog.dataset.pinned = 'true';
          pinnedDialogs.push(dialog);
          pinBtn.style.color = '#ffd400';
        } else {
          dialog.dataset.pinned = 'false';
          const index = pinnedDialogs.indexOf(dialog);
          if (index > -1) pinnedDialogs.splice(index, 1);
          pinBtn.style.color = '';
        }
      });
    }

    const copyBtn = dialog.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(content);
      });
    }

    // Manejar cambio de idioma en traducción
    const langSelector = dialog.querySelector('.ai-lang-selector');
    if (langSelector) {
      langSelector.addEventListener('change', async (e) => {
        const newLang = e.target.value;
        const answerDiv = dialog.querySelector('.ai-answer');

        // Mostrar estado de carga
        answerDiv.textContent = 'Procesando...';

        // Callback de progreso
        const onProgress = (percent) => {
          answerDiv.textContent = `Procesando  ${percent}%`;
        };

        try {
          const result = await AIModule.aiTranslate(selectedText, newLang, onProgress);
          MarkdownRenderer.renderToElement(answerDiv, result);
        } catch (error) {
          answerDiv.textContent = 'Error: ' + error.message;
        }
      });
    }

    // Botón Regenerar
    const regenerateBtn = dialog.querySelector('.regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        const currentAction = dialog.dataset.action;
        const answerDiv = dialog.querySelector('.ai-answer');
        const currentLang = langSelector ? langSelector.value : 'es';

        answerDiv.textContent = 'Procesando...';

        // Callback de progreso
        const onProgress = (percent) => {
          answerDiv.textContent = `Procesando modelo ${percent}%`;
        };

        try {
          let result = '';
          switch (currentAction) {
            case 'summarize':
              result = await AIModule.aiSummarize(selectedText, onProgress);
              break;
            case 'translate':
              result = await AIModule.aiTranslate(selectedText, currentLang, onProgress);
              break;
            case 'explain':
              result = await AIModule.aiExplain(selectedText, onProgress);
              break;
            case 'grammar':
              result = await AIModule.aiGrammar(selectedText, onProgress);
              break;
            case 'rewrite':
              result = await AIModule.aiRewrite(selectedText, onProgress);
              break;
            case 'expand':
              result = await AIModule.aiExpand(selectedText, onProgress);
              break;
            case 'answer':
              result = await AIModule.aiAnswer(selectedText, onProgress);
              break;
          }
          MarkdownRenderer.renderToElement(answerDiv, result);
        } catch (error) {
          answerDiv.textContent = 'Error: ' + error.message;
        }
      });
    }

    // Botón Editar
    const editBtn = dialog.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const answerDiv = dialog.querySelector('.ai-answer');
        const currentText = answerDiv.textContent;

        // Convertir a textarea editable
        const textarea = document.createElement('textarea');
        textarea.value = currentText;
        textarea.style.width = '100%';
        textarea.style.minHeight = '100px';
        textarea.style.background = '#1f1f23';
        textarea.style.color = '#eaeaf0';
        textarea.style.border = '1px solid #3a3a40';
        textarea.style.borderRadius = '6px';
        textarea.style.padding = '12px';
        textarea.style.fontFamily = 'inherit';
        textarea.style.fontSize = '15px';
        textarea.style.lineHeight = '1.5';
        textarea.style.resize = 'vertical';
        textarea.style.outline = 'none';

        answerDiv.innerHTML = '';
        answerDiv.appendChild(textarea);
        textarea.focus();

        // Guardar al perder foco
        textarea.addEventListener('blur', () => {
          answerDiv.textContent = textarea.value;
        });
      });
    }

    // Botón Hablar
    const speakBtn = dialog.querySelector('.speak-btn');
    if (speakBtn) {
      let isSpeaking = false;
      let utterance = null;

      speakBtn.addEventListener('click', () => {
        const answerDiv = dialog.querySelector('.ai-answer');
        const text = answerDiv.textContent;

        if (!isSpeaking) {
          // Iniciar síntesis de voz
          if ('speechSynthesis' in window) {
            utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 1;
            utterance.pitch = 1;

            utterance.onend = () => {
              isSpeaking = false;
              speakBtn.style.color = '';
            };

            window.speechSynthesis.speak(utterance);
            isSpeaking = true;
            speakBtn.style.color = '#8ab4ff';
          } else {
            alert('Tu navegador no soporta síntesis de voz');
          }
        } else {
          // Detener síntesis de voz
          window.speechSynthesis.cancel();
          isSpeaking = false;
          speakBtn.style.color = '';
        }
      });
    }

    // Sistema de chat de seguimiento
    const followupInput = dialog.querySelector('.ai-followup input');
    const sendBtn = dialog.querySelector('.ai-send-btn');
    const chatHistory = dialog.querySelector('.ai-chat-history');
    const previewDiv = dialog.querySelector('.ai-preview');
    const answerDiv = dialog.querySelector('.ai-answer');

    // Historial de conversación
    let conversationHistory = [
      { role: 'user', content: selectedText },
      { role: 'assistant', content: content }
    ];

    // Función para enviar mensaje
    const sendMessage = async () => {
      if (!followupInput.value.trim()) return;

      const userMessage = followupInput.value.trim();
      followupInput.value = '';

      console.log('💬 Pregunta de seguimiento:', userMessage);

      // Cambiar a modo chat
      if (previewDiv.style.display !== 'none') {
        previewDiv.style.display = 'none';
        answerDiv.style.display = 'none';
        chatHistory.style.display = 'flex';

        // Agregar mensajes iniciales al historial visual
        addChatMessage(chatHistory, 'user', selectedText);
        addChatMessage(chatHistory, 'assistant', content);
      }

      // Agregar mensaje del usuario
      conversationHistory.push({ role: 'user', content: userMessage });
      addChatMessage(chatHistory, 'user', userMessage);

      // Mostrar indicador de carga
      const loadingMsg = addChatMessage(chatHistory, 'assistant', 'Procesando...');

      // Callback de progreso
      const onProgress = (percent) => {
        loadingMsg.querySelector('.ai-chat-bubble').textContent = `Procesando${percent}%`;
      };

      try {
        // Llamar a la API de chat con el historial de conversación
        const result = await AIModule.aiChat(conversationHistory, onProgress);

        // Agregar respuesta al historial
        conversationHistory.push({ role: 'assistant', content: result });

        // Reemplazar mensaje de carga con respuesta real (renderizado en Markdown)
        const chatBubble = loadingMsg.querySelector('.ai-chat-bubble');
        MarkdownRenderer.renderToElement(chatBubble, result);

        // Auto-scroll al final
        chatHistory.scrollTop = chatHistory.scrollHeight;

      } catch (error) {
        loadingMsg.querySelector('.ai-chat-bubble').textContent = 'Error: ' + error.message;
      }
    };

    // Event listener para Enter
    if (followupInput) {
      followupInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          await sendMessage();
        }
      });
    }

    // Event listener para botón de enviar
    if (sendBtn) {
      sendBtn.addEventListener('click', async () => {
        await sendMessage();
      });
    }
  }

  function addChatMessage(container, role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-chat-message ${role}`;

    const label = document.createElement('div');
    label.className = 'ai-chat-label';
    label.textContent = role === 'user' ? 'Tú' : 'Asistente';

    const bubble = document.createElement('div');
    bubble.className = 'ai-chat-bubble';

    // Renderizar markdown solo para mensajes del asistente
    if (role === 'assistant') {
      MarkdownRenderer.renderToElement(bubble, content);
    } else {
      bubble.textContent = content;
    }

    messageDiv.appendChild(label);
    messageDiv.appendChild(bubble);
    container.appendChild(messageDiv);

    return messageDiv;
  }

  function getActionTitle(action) {
    const titles = {
      'summarize': 'Resumir',
      'translate': 'Traducir',
      'explain': 'Explicar esto',
      'grammar': 'Gramática',
      'rewrite': 'Reescribir',
      'expand': 'Expandir',
      'answer': 'Responder a esta pregunta'
    };
    return titles[action] || 'Resultado';
  }

  function getCurrentDialog() {
    const dialogs = document.querySelectorAll('.ai-result-panel');
    for (let dialog of dialogs) {
      if (dialog.dataset.pinned === 'false') {
        return dialog;
      }
    }
    return null;
  }

  function removeCurrentDialog() {
    const dialog = getCurrentDialog();
    if (dialog) {
      dialog.remove();
    }
  }

  return {
    createDialog,
    showLoadingDialog,
    getCurrentDialog,
    removeCurrentDialog
  };
})();

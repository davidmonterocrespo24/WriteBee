const ChatPanelModule = (function() {
  let chatPanel = null;
  let conversationHistory = [];
  let currentSession = null;
  let isRecording = false;
  let mediaRecorder = null;
  let attachedImageFile = null; // Para guardar el archivo de imagen

  /**
   * Abrir el panel de chat con contexto inicial
   */
  function openChatPanel(initialContext = null, initialAction = null) {
    // Si ya existe, solo mostrarlo
    if (chatPanel) {
      chatPanel.classList.add('active');
      document.body.classList.add('ai-chat-open');
      localStorage.setItem('aiChatPanelOpen', 'true');
      if (initialContext) {
        addMessageToHistory('user', initialContext);
        if (initialAction) {
          processMessage(initialContext, initialAction);
        }
      }
      return;
    }

    // Crear el panel
    createChatPanel();

    // Si hay contexto inicial, agregarlo
    if (initialContext) {
      conversationHistory.push({
        role: 'user',
        content: initialContext,
        timestamp: Date.now()
      });
      renderChatHistory();

      if (initialAction) {
        processMessage(initialContext, initialAction);
      }
    }

    // Guardar estado
    localStorage.setItem('aiChatPanelOpen', 'true');
  }

  /**
   * Crear el panel de chat
   */
  function createChatPanel() {
    chatPanel = document.createElement('div');
    chatPanel.className = 'ai-chat-panel';
    chatPanel.innerHTML = `
        <header class="ai-chat-header">
          <div class="ai-chat-header-left">
            <div class="ai-avatar" title="AI Assistant">
              <div class="eyes"><span></span><span></span></div>
            </div>
            <div class="ai-chat-title">
              <h3>Chat AI</h3>
              <span class="ai-chat-status">En línea</span>
            </div>
          </div>
          <div class="ai-chat-header-right">
            <button class="ai-iconbtn new-chat-btn" aria-label="Nueva conversación" title="Nueva conversación">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
            </button>
            <button class="ai-iconbtn close-chat-btn" aria-label="Cerrar" title="Cerrar chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </header>

        <div class="ai-chat-messages" id="chatMessages">
          <div class="ai-chat-welcome">
            <div class="ai-avatar-large">
              <div class="eyes"><span></span><span></span></div>
            </div>
            <h2>¡Hola! Soy tu asistente AI</h2>
            <p>Puedo ayudarte a resumir, traducir, explicar textos y mucho más. También puedo procesar imágenes y audio.</p>
            <div class="ai-chat-suggestions">
              <button class="ai-suggestion-chip" data-action="chat-with-page">
                💬 Chat with this page
              </button>
              <button class="ai-suggestion-chip" data-suggestion="Ayúdame a escribir un correo profesional">
                ✉️ Escribir correo
              </button>
              <button class="ai-suggestion-chip" data-suggestion="Resume este texto en 3 puntos clave">
                📝 Resumir texto
              </button>
              <button class="ai-suggestion-chip" data-suggestion="Traduce este texto al inglés">
                🌐 Traducir
              </button>
              <button class="ai-suggestion-chip" data-suggestion="Explícame este concepto de forma simple">
                💡 Explicar
              </button>
            </div>
          </div>
        </div>

        <div class="ai-chat-input-container">
          <div class="ai-chat-attachments" id="chatAttachments" style="display: none;"></div>

          <div class="ai-chat-input-wrapper">
            <button class="ai-iconbtn attach-image-btn" aria-label="Adjuntar imagen" title="Adjuntar imagen">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </button>

            <input
              type="file"
              accept="image/*"
              style="display: none;"
              id="chatImageInput"
            />

            <div class="ai-chat-input-field">
              <textarea
                id="chatInput"
                placeholder="Escribe tu mensaje..."
                rows="1"
              ></textarea>
            </div>

            <button class="ai-iconbtn voice-btn" aria-label="Mensaje de voz" title="Grabar mensaje de voz">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <path d="M12 19v4M8 23h8"/>
              </svg>
            </button>

            <button class="ai-iconbtn send-btn" aria-label="Enviar" title="Enviar mensaje">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13"/>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>
        </div>
    `;

    document.body.appendChild(chatPanel);
    
    // Cargar historial guardado
    loadSavedHistory();
    
    setupChatEvents();

    // Mostrar con animación
    requestAnimationFrame(() => {
      chatPanel.classList.add('active');
      document.body.classList.add('ai-chat-open');
    });
  }

  /**
   * Configurar eventos del chat
   */
  function setupChatEvents() {
    const closeBtn = chatPanel.querySelector('.close-chat-btn');
    const newChatBtn = chatPanel.querySelector('.new-chat-btn');
    const input = chatPanel.querySelector('#chatInput');
    const sendBtn = chatPanel.querySelector('.send-btn');
    const voiceBtn = chatPanel.querySelector('.voice-btn');
    const attachBtn = chatPanel.querySelector('.attach-image-btn');
    const imageInput = chatPanel.querySelector('#chatImageInput');

    // Cerrar panel
    closeBtn.addEventListener('click', closeChatPanel);

    // Nueva conversación
    newChatBtn.addEventListener('click', () => {
      if (conversationHistory.length > 0) {
        if (confirm('¿Deseas iniciar una nueva conversación? Se perderá el historial actual.')) {
          startNewConversation();
        }
      } else {
        startNewConversation();
      }
    });

    // Auto-resize del textarea
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    // Enviar con Enter (Shift+Enter para nueva línea)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Enviar con botón
    sendBtn.addEventListener('click', sendMessage);

    // Grabar voz
    voiceBtn.addEventListener('click', toggleVoiceRecording);

    // Adjuntar imagen
    attachBtn.addEventListener('click', () => {
      imageInput.click();
    });

    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        attachImage(file);
      }
    });

    // Suggestions
    const suggestionChips = chatPanel.querySelectorAll('.ai-suggestion-chip');
    suggestionChips.forEach(chip => {
      chip.addEventListener('click', async () => {
        // Check if it's a special action
        if (chip.dataset.action === 'chat-with-page') {
          await startChatWithPage();
        } else if (chip.dataset.suggestion) {
          const suggestion = chip.dataset.suggestion;
          input.value = suggestion;
          input.focus();
          sendMessage();
        }
      });
    });
  }

  /**
   * Enviar mensaje
   */
  async function sendMessage() {
    const input = chatPanel.querySelector('#chatInput');
    const message = input.value.trim();
    const attachmentsDiv = chatPanel.querySelector('#chatAttachments');
    const attachedImage = attachmentsDiv.querySelector('.ai-chat-attachment');

    if (!message && !attachedImage) return;

    // Limpiar welcome si existe
    const welcome = chatPanel.querySelector('.ai-chat-welcome');
    if (welcome) {
      welcome.remove();
    }

    // Obtener imagen adjunta si existe
    let imageFile = null;
    let imageUrl = null;

    if (attachedImage && attachedImageFile) {
      imageFile = attachedImageFile;
      imageUrl = URL.createObjectURL(imageFile);
    }

    // Agregar mensaje del usuario
    const userMessage = {
      role: 'user',
      content: message || '📷 [Imagen adjunta]',
      image: imageUrl,
      imageFile: imageFile,
      timestamp: Date.now()
    };

    conversationHistory.push(userMessage);
    renderChatHistory();

    // Limpiar input y attachments
    input.value = '';
    input.style.height = 'auto';
    attachmentsDiv.style.display = 'none';
    attachmentsDiv.innerHTML = '';
    attachedImageFile = null; // Limpiar archivo adjunto

    // Procesar mensaje
    await processMessage(message, null, imageFile);
  }

  /**
   * Procesar mensaje con AI
   */
  async function processMessage(message, action = null, imageFile = null) {
    const messagesContainer = chatPanel.querySelector('#chatMessages');

    // Agregar mensaje de "escribiendo..."
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'ai-chat-message ai-message typing-indicator';
    typingIndicator.innerHTML = `
      <div class="ai-message-avatar">
        <div class="ai-avatar-small">
          <div class="eyes"><span></span><span></span></div>
        </div>
      </div>
      <div class="ai-message-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    messagesContainer.appendChild(typingIndicator);
    scrollToBottom();

    try {
      let response = '';

      // Si hay imagen, procesarla
      if (imageFile) {
        const imageAction = action || 'describe';
        response = await MultimodalModule.processImageWithAction(
          imageFile,
          imageAction,
          message,
          (progress) => {
            // Actualizar en tiempo real
            const contentDiv = typingIndicator.querySelector('.ai-message-content');
            contentDiv.innerHTML = `<div class="ai-message-text">${progress}</div>`;
          }
        );
      } else {
        // Procesamiento de texto basado en acción
        if (action) {
          switch (action) {
            case 'summarize':
              response = await AIModule.aiSummarize(message, (progress) => {
                const contentDiv = typingIndicator.querySelector('.ai-message-content');
                contentDiv.innerHTML = `<div class="ai-message-text">${progress}</div>`;
              });
              break;
            case 'translate':
              response = await AIModule.aiTranslate(message, 'es', (progress) => {
                const contentDiv = typingIndicator.querySelector('.ai-message-content');
                contentDiv.innerHTML = `<div class="ai-message-text">${progress}</div>`;
              });
              break;
            case 'explain':
              response = await AIModule.aiExplain(message, (progress) => {
                const contentDiv = typingIndicator.querySelector('.ai-message-content');
                contentDiv.innerHTML = `<div class="ai-message-text">${progress}</div>`;
              });
              break;
            default:
              response = await AIModule.aiAnswer(message, (progress) => {
                const contentDiv = typingIndicator.querySelector('.ai-message-content');
                contentDiv.innerHTML = `<div class="ai-message-text">${progress}</div>`;
              });
          }
        } else {
          // Chat normal con historial
          response = await AIModule.aiChat(conversationHistory, (progress) => {
            const contentDiv = typingIndicator.querySelector('.ai-message-content');
            contentDiv.innerHTML = `<div class="ai-message-text">${progress}</div>`;
          });
        }
      }

      // Remover typing indicator
      typingIndicator.remove();

      // Agregar respuesta al historial
      const aiMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      conversationHistory.push(aiMessage);
      renderChatHistory();
      saveHistory();

    } catch (error) {
      console.error('Error al procesar mensaje:', error);
      typingIndicator.remove();

      const errorMessage = {
        role: 'assistant',
        content: `❌ Error: ${error.message}`,
        timestamp: Date.now()
      };

      conversationHistory.push(errorMessage);
      renderChatHistory();
      saveHistory();
    }
  }

  /**
   * Renderizar historial de chat
   */
  function renderChatHistory() {
    const messagesContainer = chatPanel.querySelector('#chatMessages');

    // Guardar scroll position
    const wasAtBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop === messagesContainer.clientHeight;

    // Limpiar mensajes existentes (excepto welcome si existe)
    const welcome = messagesContainer.querySelector('.ai-chat-welcome');
    messagesContainer.innerHTML = '';

    if (conversationHistory.length === 0 && welcome) {
      messagesContainer.appendChild(welcome);
      return;
    }

    // Renderizar mensajes (skip system messages)
    conversationHistory.forEach((msg, index) => {
      // Skip system messages from rendering
      if (msg.role === 'system') return;

      const messageDiv = document.createElement('div');
      messageDiv.className = `ai-chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;

      if (msg.role === 'user') {
        messageDiv.innerHTML = `
          <div class="ai-message-content">
            ${msg.image ? `<img src="${msg.image}" alt="Imagen adjunta" class="ai-chat-image">` : ''}
            <div class="ai-message-text">${escapeHtml(msg.content)}</div>
            <div class="ai-message-time">${formatTime(msg.timestamp)}</div>
          </div>
        `;
      } else {
        const contentDiv = document.createElement('div');
        contentDiv.className = 'ai-message-content';

        // Crear elementos
        const avatar = document.createElement('div');
        avatar.className = 'ai-message-avatar';
        avatar.innerHTML = `
          <div class="ai-avatar-small">
            <div class="eyes"><span></span><span></span></div>
          </div>
        `;

        const textDiv = document.createElement('div');
        textDiv.className = 'ai-message-text';

        // Renderizar con Markdown
        if (typeof MarkdownRenderer !== 'undefined') {
          MarkdownRenderer.renderToElement(textDiv, msg.content);
        } else {
          textDiv.textContent = msg.content;
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'ai-message-actions';
        actionsDiv.innerHTML = `
          <button class="ai-message-action-btn copy-message-btn" data-index="${index}" title="Copiar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
          <button class="ai-message-action-btn regenerate-message-btn" data-index="${index}" title="Regenerar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
          <button class="ai-message-action-btn speak-message-btn" data-index="${index}" title="Escuchar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          </button>
          <span class="ai-message-time">${formatTime(msg.timestamp)}</span>
        `;

        messageDiv.appendChild(avatar);
        contentDiv.appendChild(textDiv);
        contentDiv.appendChild(actionsDiv);
        messageDiv.appendChild(contentDiv);
      }

      messagesContainer.appendChild(messageDiv);
    });

    // Setup action buttons
    const copyBtns = messagesContainer.querySelectorAll('.copy-message-btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const message = conversationHistory[index];
        navigator.clipboard.writeText(message.content);
        btn.innerHTML = `<span style="font-size: 0.9rem;">✓</span>`;
        setTimeout(() => {
          btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          `;
        }, 2000);
      });
    });

    const regenerateBtns = messagesContainer.querySelectorAll('.regenerate-message-btn');
    regenerateBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const index = parseInt(btn.dataset.index);
        if (index > 0) {
          const userMessage = conversationHistory[index - 1];
          // Eliminar el mensaje AI actual y regenerar
          conversationHistory.splice(index, 1);
          renderChatHistory();
          await processMessage(userMessage.content, null, userMessage.imageFile);
        }
      });
    });

    const speakBtns = messagesContainer.querySelectorAll('.speak-message-btn');
    speakBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        const message = conversationHistory[index];

        if ('speechSynthesis' in window) {
          // Detener si ya está hablando
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            btn.style.color = '';
            return;
          }

          const utterance = new SpeechSynthesisUtterance(message.content);
          utterance.lang = 'es-ES';
          utterance.rate = 1;
          utterance.pitch = 1;

          utterance.onend = () => {
            btn.style.color = '';
          };

          window.speechSynthesis.speak(utterance);
          btn.style.color = '#667eea';
        } else {
          alert('Tu navegador no soporta síntesis de voz');
        }
      });
    });

    // Scroll to bottom si estaba al final
    if (wasAtBottom || conversationHistory.length <= 2) {
      scrollToBottom();
    }
  }

  /**
   * Toggle grabación de voz
   */
  async function toggleVoiceRecording() {
    const voiceBtn = chatPanel.querySelector('.voice-btn');
    const input = chatPanel.querySelector('#chatInput');

    if (isRecording) {
      // Detener grabación
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      isRecording = false;
      voiceBtn.classList.remove('recording');
      voiceBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <path d="M12 19v4M8 23h8"/>
        </svg>
      `;
    } else {
      // Iniciar grabación
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const chunks = [];

        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          stream.getTracks().forEach(t => t.stop());

          // Transcribir audio
          try {
            input.value = 'Transcribiendo...';
            const transcription = await MultimodalModule.transcribeAudio(audioBlob, 'transcribe');
            input.value = transcription;
            input.focus();
            input.style.height = 'auto';
            input.style.height = Math.min(input.scrollHeight, 120) + 'px';
          } catch (error) {
            console.error('Error al transcribir:', error);
            input.value = '';
            alert('Error al transcribir audio: ' + error.message);
          }
        };

        mediaRecorder.start(100);
        isRecording = true;
        voiceBtn.classList.add('recording');
        voiceBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="red" stroke="currentColor" stroke-width="2">
            <rect x="6" y="6" width="12" height="12"/>
          </svg>
        `;

      } catch (error) {
        console.error('Error al acceder al micrófono:', error);
        alert('No se pudo acceder al micrófono: ' + error.message);
      }
    }
  }

  /**
   * Adjuntar imagen
   */
  function attachImage(file) {
    const attachmentsDiv = chatPanel.querySelector('#chatAttachments');
    const imageUrl = URL.createObjectURL(file);

    // Guardar el archivo en la variable global
    attachedImageFile = file;

    attachmentsDiv.innerHTML = `
      <div class="ai-chat-attachment">
        <img src="${imageUrl}" alt="Imagen adjunta">
        <button class="remove-attachment-btn" aria-label="Eliminar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
        <div class="ai-chat-attachment-actions">
          <select class="image-action-select">
            <option value="describe">Describir imagen</option>
            <option value="summarize">Resumir contenido</option>
            <option value="translate">Traducir texto</option>
            <option value="explain">Explicar imagen</option>
            <option value="alttext">Generar alt text</option>
          </select>
        </div>
      </div>
    `;

    attachmentsDiv.style.display = 'block';

    // Botón eliminar
    const removeBtn = attachmentsDiv.querySelector('.remove-attachment-btn');
    removeBtn.addEventListener('click', () => {
      attachmentsDiv.style.display = 'none';
      attachmentsDiv.innerHTML = '';
      chatPanel.querySelector('#chatImageInput').value = '';
      attachedImageFile = null; // Limpiar archivo adjunto
    });
  }

  /**
   * Iniciar nueva conversación
   */
  function startNewConversation() {
    conversationHistory = [];
    currentSession = null;
    attachedImageFile = null; // Limpiar archivo adjunto
    saveHistory(); // Guardar historial vacío

    const messagesContainer = chatPanel.querySelector('#chatMessages');
    messagesContainer.innerHTML = `
      <div class="ai-chat-welcome">
        <div class="ai-avatar-large">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <h2>Nueva conversación iniciada</h2>
        <p>¿En qué puedo ayudarte hoy?</p>
      </div>
    `;

    const input = chatPanel.querySelector('#chatInput');
    input.value = '';
    input.style.height = 'auto';
    input.focus();
  }

  /**
   * Cerrar panel de chat
   */
  function closeChatPanel() {
    if (chatPanel) {
      chatPanel.classList.remove('active');
      document.body.classList.remove('ai-chat-open');
      localStorage.setItem('aiChatPanelOpen', 'false');
    }
  }

  /**
   * Scroll to bottom del chat
   */
  function scrollToBottom() {
    const messagesContainer = chatPanel.querySelector('#chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  /**
   * Formatear tiempo
   */
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Cargar historial guardado
   */
  function loadSavedHistory() {
    try {
      const saved = localStorage.getItem('aiChatHistory');
      if (saved) {
        conversationHistory = JSON.parse(saved);
        renderChatHistory();
      }
    } catch (error) {
      console.error('Error al cargar historial:', error);
    }
  }

  /**
   * Guardar historial
   */
  function saveHistory() {
    try {
      // Guardar solo los últimos 50 mensajes para no exceder límite de localStorage
      const historyToSave = conversationHistory.slice(-50).map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
        // No guardamos las imágenes en localStorage por tamaño
      }));
      localStorage.setItem('aiChatHistory', JSON.stringify(historyToSave));
    } catch (error) {
      console.error('Error al guardar historial:', error);
    }
  }

  /**
   * Obtener historial de conversación
   */
  function getConversationHistory() {
    return conversationHistory;
  }

  /**
   * Verificar si el panel está abierto
   */
  function isOpen() {
    return chatPanel && chatPanel.classList.contains('active');
  }

  /**
   * Iniciar chat con la página actual
   */
  async function startChatWithPage() {
    // Remove welcome message
    const welcome = chatPanel.querySelector('.ai-chat-welcome');
    if (welcome) {
      welcome.remove();
    }

    // Extract page content
    const pageContent = WebChatModule.extractPageContent();
    const metadata = WebChatModule.getPageMetadata();

    // Add system message with page context
    const contextMessage = {
      role: 'system',
      content: `You are now chatting about this web page:\n\nTitle: ${metadata.title}\nURL: ${metadata.url}\n\nPage content:\n${pageContent.substring(0, 8000)}`,
      timestamp: Date.now()
    };

    conversationHistory.push(contextMessage);

    // Add AI welcome message
    const welcomeMessage = {
      role: 'assistant',
      content: `I'm ready to help you with this page: **${metadata.title}**\n\nWhat would you like to know about it?`,
      timestamp: Date.now()
    };

    conversationHistory.push(welcomeMessage);
    renderChatHistory();
    saveHistory();

    // Focus on input
    const input = chatPanel.querySelector('#chatInput');
    input.focus();
  }

  /**
   * Inicializar al cargar la página
   */
  function init() {
    // Verificar si el panel estaba abierto
    const wasOpen = localStorage.getItem('aiChatPanelOpen') === 'true';
    if (wasOpen) {
      // Esperar un poco para que la página cargue
      setTimeout(() => {
        openChatPanel();
      }, 500);
    }
  }

  return {
    openChatPanel,
    closeChatPanel,
    getConversationHistory,
    isOpen,
    init
  };
})();

// Exponer globalmente
window.ChatPanelModule = ChatPanelModule;

// Inicializar al cargar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => ChatPanelModule.init());
} else {
  ChatPanelModule.init();
}

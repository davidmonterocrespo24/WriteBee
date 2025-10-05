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
      chatPanel.style.display = 'flex';
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
  }

  /**
   * Crear el panel de chat
   */
  function createChatPanel() {
    chatPanel = document.createElement('div');
    chatPanel.className = 'ai-chat-panel';
    chatPanel.innerHTML = `
      <div class="ai-chat-panel-overlay"></div>
      <div class="ai-chat-panel-container">
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
      </div>
    `;

    document.body.appendChild(chatPanel);
    setupChatEvents();

    // Mostrar con animación
    setTimeout(() => {
      chatPanel.classList.add('active');
    }, 10);
  }

  /**
   * Configurar eventos del chat
   */
  function setupChatEvents() {
    const overlay = chatPanel.querySelector('.ai-chat-panel-overlay');
    const closeBtn = chatPanel.querySelector('.close-chat-btn');
    const newChatBtn = chatPanel.querySelector('.new-chat-btn');
    const input = chatPanel.querySelector('#chatInput');
    const sendBtn = chatPanel.querySelector('.send-btn');
    const voiceBtn = chatPanel.querySelector('.voice-btn');
    const attachBtn = chatPanel.querySelector('.attach-image-btn');
    const imageInput = chatPanel.querySelector('#chatImageInput');

    // Cerrar panel
    overlay.addEventListener('click', closeChatPanel);
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
      chip.addEventListener('click', () => {
        const suggestion = chip.dataset.suggestion;
        input.value = suggestion;
        input.focus();
        sendMessage();
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

    // Renderizar mensajes
    conversationHistory.forEach((msg, index) => {
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
        messageDiv.innerHTML = `
          <div class="ai-message-avatar">
            <div class="ai-avatar-small">
              <div class="eyes"><span></span><span></span></div>
            </div>
          </div>
          <div class="ai-message-content">
            <div class="ai-message-text">${msg.content}</div>
            <div class="ai-message-actions">
              <button class="ai-message-action-btn copy-message-btn" data-index="${index}" title="Copiar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
              </button>
              <span class="ai-message-time">${formatTime(msg.timestamp)}</span>
            </div>
          </div>
        `;
      }

      messagesContainer.appendChild(messageDiv);
    });

    // Setup copy buttons
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
      setTimeout(() => {
        chatPanel.style.display = 'none';
      }, 300);
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

  return {
    openChatPanel,
    closeChatPanel,
    getConversationHistory,
    isOpen
  };
})();

// Exponer globalmente
window.ChatPanelModule = ChatPanelModule;

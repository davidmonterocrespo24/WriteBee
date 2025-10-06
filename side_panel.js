// Side Panel Chat - Lógica del chat en el panel lateral
console.log('📜 side_panel.js cargado - empezando ejecución');

(function initSidePanel() {
  try {
    console.log('🚀 Inicializando Side Panel Chat');
    console.log('⏰ Timestamp:', Date.now());
    console.log('📄 Document ready state:', document.readyState);

    // Verificar módulos disponibles
    console.log('📦 Módulos disponibles:', {
      AIModule: typeof AIModule !== 'undefined',
      MultimodalModule: typeof MultimodalModule !== 'undefined',
      MarkdownRenderer: typeof MarkdownRenderer !== 'undefined',
      AIServiceInstance: typeof window.AIServiceInstance !== 'undefined'
    });

  let conversationHistory = [];
  let isRecording = false;
  let mediaRecorder = null;
  let attachedImageFile = null;

  // Elementos del DOM
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const attachImageBtn = document.getElementById('attachImageBtn');
  const imageInput = document.getElementById('imageInput');
  const chatAttachments = document.getElementById('chatAttachments');
  const recordingIndicator = document.getElementById('recordingIndicator');

  console.log('✅ Elementos DOM cargados:', {
    chatMessages: !!chatMessages,
    chatInput: !!chatInput,
    sendBtn: !!sendBtn,
    imageInput: !!imageInput,
    voiceBtn: !!voiceBtn,
    attachImageBtn: !!attachImageBtn
  });

  // Cargar historial guardado
  loadHistory();

  // Setup suggestion chips
  setupSuggestionChips();

  // Event listeners
  if (chatInput) {
    chatInput.addEventListener('input', handleInputChange);
    chatInput.addEventListener('keydown', handleKeyDown);
    console.log('✅ Event listeners agregados a chatInput');
  } else {
    console.error('❌ chatInput no encontrado');
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      console.log('🔵 Click en sendBtn detectado');
      sendMessage();
    });
    console.log('✅ Event listener agregado a sendBtn');
  } else {
    console.error('❌ sendBtn no encontrado');
  }

  if (newChatBtn) {
    newChatBtn.addEventListener('click', newConversation);
    console.log('✅ Event listener agregado a newChatBtn');
  } else {
    console.error('❌ newChatBtn no encontrado');
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      console.log('🔵 Click en voiceBtn detectado');
      toggleVoiceRecording();
    });
    console.log('✅ Event listener agregado a voiceBtn');
  } else {
    console.error('❌ voiceBtn no encontrado');
  }

  if (attachImageBtn) {
    attachImageBtn.addEventListener('click', () => {
      console.log('🔵 Click en attachImageBtn detectado');
      imageInput.click();
    });
    console.log('✅ Event listener agregado a attachImageBtn');
  } else {
    console.error('❌ attachImageBtn no encontrado');
  }

  if (imageInput) {
    imageInput.addEventListener('change', handleImageSelect);
    console.log('✅ Event listener agregado a imageInput');
  } else {
    console.error('❌ imageInput no encontrado');
  }

  /**
   * Setup suggestion chips
   */
  function setupSuggestionChips() {
    const chips = document.querySelectorAll('.suggestion-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const suggestion = chip.dataset.suggestion;
        chatInput.value = suggestion;
        chatInput.focus();
        handleInputChange();
        // Opcionalmente enviar automáticamente
        // sendMessage();
      });
    });
  }

  // Listener para recibir datos del diálogo
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Mensaje recibido en side panel:', request.action);

    if (request.action === 'chatData' && request.data) {
      const { selectedText, currentAnswer, action } = request.data;

      console.log('📥 Datos del diálogo recibidos:', {
        selectedText: selectedText?.substring(0, 50) + '...',
        currentAnswer: currentAnswer?.substring(0, 50) + '...',
        action
      });

      // 🆕 NUEVA CONVERSACIÓN: Limpiar historial existente antes de agregar nuevo contexto
      console.log('🆕 Iniciando nueva conversación con contexto del diálogo');
      conversationHistory = [];

      // Agregar el texto seleccionado como mensaje del usuario
      if (selectedText && selectedText.trim()) {
        conversationHistory.push({
          role: 'user',
          content: selectedText,
          timestamp: Date.now()
        });
        console.log('✅ Mensaje del usuario agregado');
      }

      // Agregar la respuesta del asistente si existe
      if (currentAnswer && currentAnswer.trim()) {
        conversationHistory.push({
          role: 'assistant',
          content: currentAnswer,
          timestamp: Date.now()
        });
        console.log('✅ Respuesta del asistente agregada');
      }

      // Renderizar el historial actualizado
      renderChatHistory();
      saveHistory();

      // Hacer scroll al final
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);

      sendResponse({ success: true });
    }
    return true;
  });

  /**
   * Manejar cambios en el input
   */
  function handleInputChange() {
    // Auto-resize textarea
    chatInput.style.height = 'auto';
    chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';

    // Habilitar/deshabilitar botón enviar
    sendBtn.disabled = !chatInput.value.trim() && !attachedImageFile;
  }

  /**
   * Manejar teclas en el input
   */
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled) {
        sendMessage();
      }
    }
  }

  /**
   * Enviar mensaje
   */
  async function sendMessage() {
    console.log('📤 sendMessage llamado');
    const text = chatInput.value.trim();

    if (!text && !attachedImageFile) {
      console.log('⚠️ No hay texto ni imagen adjunta');
      return;
    }

    console.log('📝 Enviando mensaje:', { text: text.substring(0, 50), hasImage: !!attachedImageFile });

    // Obtener acción seleccionada para imagen si existe
    let imageAction = null;
    if (attachedImageFile) {
      const imageActionSelect = document.getElementById('imageActionSelect');
      imageAction = imageActionSelect ? imageActionSelect.value : 'describe';
    }

    // Agregar mensaje del usuario
    const userMessage = {
      role: 'user',
      content: text || `Imagen adjunta (${imageAction})`,
      timestamp: Date.now(),
      image: attachedImageFile ? URL.createObjectURL(attachedImageFile) : null,
      imageFile: attachedImageFile,
      imageAction: imageAction
    };

    conversationHistory.push(userMessage);
    renderChatHistory();
    saveHistory();

    // Limpiar input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Guardar referencias antes de limpiar
    const imageFile = attachedImageFile;
    const action = imageAction;

    // Limpiar imagen adjunta
    if (attachedImageFile) {
      attachedImageFile = null;
      chatAttachments.innerHTML = '';
      chatAttachments.style.display = 'none';
    }

    // Procesar mensaje con IA
    await processMessage(text, action, imageFile);
  }

  /**
   * Procesar mensaje con IA
   */
  async function processMessage(text, action = null, imageFile = null) {
    // Agregar mensaje temporal del asistente con typing indicator
    const assistantMessage = {
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isTyping: true
    };

    conversationHistory.push(assistantMessage);
    renderChatHistory();

    try {
      let result = '';

      // Callback para actualizar contenido en tiempo real
      const onChunk = (chunk) => {
        assistantMessage.content = chunk;
        assistantMessage.isTyping = false;
        renderChatHistory();
      };

      // Si hay imagen, procesarla con multimodal según la acción
      if (imageFile) {
        console.log('🖼️ Procesando imagen con acción:', action);
        if (typeof MultimodalModule !== 'undefined') {
          if (action && action !== 'describe') {
            // Usar processImageWithAction para acciones específicas
            result = await MultimodalModule.processImageWithAction(imageFile, action, text, onChunk);
          } else {
            // Usar describeImage para descripción general
            result = await MultimodalModule.describeImage(imageFile, text || 'Describe esta imagen en detalle', onChunk);
          }
        } else {
          throw new Error('MultimodalModule no está disponible');
        }
      }
      // Si hay una acción específica, usar streaming
      else if (action) {
        console.log('⚙️ Ejecutando acción:', action);
        switch (action) {
          case 'summarize':
            result = await AIModule.aiSummarizeStream(text, onChunk);
            break;
          case 'translate':
            result = await AIModule.aiTranslateStream(text, 'es', onChunk);
            break;
          case 'explain':
            result = await AIModule.aiExplainStream(text, onChunk);
            break;
          case 'rewrite':
            result = await AIModule.aiRewriteStream(text, onChunk);
            break;
          case 'expand':
            result = await AIModule.aiExpandStream(text, onChunk);
            break;
          case 'answer':
            result = await AIModule.aiAnswerStream(text, onChunk);
            break;
          default:
            result = await AIModule.aiChat(conversationHistory.slice(0, -1));
            assistantMessage.content = result;
        }
      }
      // Conversación normal
      else {
        console.log('💬 Procesando conversación normal');
        result = await AIModule.aiChat(conversationHistory.slice(0, -1));
        assistantMessage.content = result;
      }

      // Actualizar mensaje del asistente
      assistantMessage.content = result;
      assistantMessage.isTyping = false;
      renderChatHistory();
      saveHistory();

    } catch (error) {
      console.error('❌ Error procesando mensaje:', error);
      assistantMessage.content = '❌ Error: ' + error.message;
      assistantMessage.isTyping = false;
      renderChatHistory();
      saveHistory();
    }
  }

  /**
   * Renderizar historial de chat
   */
  function renderChatHistory() {
    // Limpiar mensajes
    chatMessages.innerHTML = '';

    if (conversationHistory.length === 0) {
      // Mostrar estado vacío con suggestion chips
      chatMessages.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <h2>Comienza una conversación</h2>
          <p>Escribe un mensaje o usa el botón "Continuar en el chat" desde cualquier diálogo AI</p>
          <div class="suggestion-chips">
            <button class="suggestion-chip" data-suggestion="Ayúdame a escribir un correo profesional">
              ✉️ Escribir correo
            </button>
            <button class="suggestion-chip" data-suggestion="Resume este texto en 3 puntos clave">
              📝 Resumir texto
            </button>
            <button class="suggestion-chip" data-suggestion="Traduce este texto al inglés">
              🌐 Traducir
            </button>
            <button class="suggestion-chip" data-suggestion="Explícame este concepto de forma simple">
              💡 Explicar
            </button>
          </div>
        </div>
      `;
      // Re-setup suggestion chips después de renderizar
      setupSuggestionChips();
      return;
    }

    // Renderizar cada mensaje
    conversationHistory.forEach((msg, index) => {
      const messageEl = document.createElement('div');
      messageEl.className = `message ${msg.role}-message`;

      const avatar = msg.role === 'user' ? 'U' : 'AI';
      const roleName = msg.role === 'user' ? 'Tú' : 'Asistente';
      const time = new Date(msg.timestamp).toLocaleTimeString('es', {
        hour: '2-digit',
        minute: '2-digit'
      });

      messageEl.innerHTML = `
        <div class="message-header">
          <div class="message-avatar">${avatar}</div>
          <div class="message-info">
            <div class="message-role">${roleName}</div>
            <div class="message-time">${time}</div>
          </div>
        </div>
        <div class="message-content" data-index="${index}">
          ${msg.isTyping ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : ''}
        </div>
        ${msg.image ? `<img src="${msg.image}" class="message-image" alt="Imagen adjunta">` : ''}
      `;

      chatMessages.appendChild(messageEl);

      // Renderizar contenido con Markdown si no está escribiendo
      if (!msg.isTyping && msg.content) {
        const contentEl = messageEl.querySelector('.message-content');
        if (typeof MarkdownRenderer !== 'undefined') {
          MarkdownRenderer.renderToElement(contentEl, msg.content);
        } else {
          contentEl.textContent = msg.content;
        }
      }

      // Agregar botones de acción para mensajes del asistente
      if (msg.role === 'assistant' && !msg.isTyping) {
        const actionsEl = document.createElement('div');
        actionsEl.className = 'message-actions';
        actionsEl.innerHTML = `
          <button class="message-action-btn copy-btn" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copiar
          </button>
          <button class="message-action-btn regenerate-btn" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Regenerar
          </button>
          <button class="message-action-btn speak-btn" data-index="${index}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            Hablar
          </button>
        `;
        messageEl.appendChild(actionsEl);

        // Event listeners para botones
        actionsEl.querySelector('.copy-btn').addEventListener('click', () => copyMessage(index));
        actionsEl.querySelector('.regenerate-btn').addEventListener('click', () => regenerateMessage(index));
        actionsEl.querySelector('.speak-btn').addEventListener('click', () => speakMessage(index));
      }
    });

    // Scroll al final
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  /**
   * Copiar mensaje
   */
  function copyMessage(index) {
    const message = conversationHistory[index];
    navigator.clipboard.writeText(message.content).then(() => {
      console.log('✅ Mensaje copiado');
    });
  }

  /**
   * Regenerar mensaje
   */
  async function regenerateMessage(index) {
    // Obtener el mensaje del usuario anterior
    const userMessage = conversationHistory[index - 1];
    if (!userMessage || userMessage.role !== 'user') return;

    // Eliminar el mensaje actual del asistente
    conversationHistory.splice(index, 1);

    // Volver a procesar
    await processMessage(userMessage.content, null, userMessage.imageFile);
  }

  /**
   * Hablar mensaje (TTS)
   */
  function speakMessage(index) {
    const message = conversationHistory[index];
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.lang = 'es-ES';
      speechSynthesis.speak(utterance);
    }
  }

  /**
   * Nueva conversación
   */
  function newConversation() {
    if (confirm('¿Deseas iniciar una nueva conversación? Se borrará el historial actual.')) {
      conversationHistory = [];
      saveHistory();
      renderChatHistory();
    }
  }

  /**
   * Manejar selección de imagen
   */
  function handleImageSelect(e) {
    console.log('🖼️ handleImageSelect llamado');
    const file = e.target.files[0];
    if (!file) {
      console.log('⚠️ No se seleccionó ningún archivo');
      return;
    }

    console.log('✅ Archivo seleccionado:', file.name, file.type);
    attachedImageFile = file;
    const imageUrl = URL.createObjectURL(file);

    chatAttachments.innerHTML = `
      <div class="chat-attachment">
        <div style="position: relative;">
          <img src="${imageUrl}" alt="Imagen adjunta">
          <button class="remove-attachment">×</button>
        </div>
        <select class="image-action-select" id="imageActionSelect">
          <option value="describe">Describir imagen</option>
          <option value="summarize">Resumir contenido</option>
          <option value="translate">Traducir texto</option>
          <option value="explain">Explicar imagen</option>
          <option value="alttext">Generar alt text</option>
        </select>
      </div>
    `;
    chatAttachments.style.display = 'flex';

    chatAttachments.querySelector('.remove-attachment').addEventListener('click', () => {
      attachedImageFile = null;
      chatAttachments.innerHTML = '';
      chatAttachments.style.display = 'none';
      imageInput.value = '';
      sendBtn.disabled = !chatInput.value.trim();
    });

    sendBtn.disabled = false;
  }

  /**
   * Toggle grabación de voz
   */
  async function toggleVoiceRecording() {
    console.log('🎤 toggleVoiceRecording llamado, isRecording:', isRecording);
    if (!isRecording) {
      try {
        // Verificar si getUserMedia está disponible
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Tu navegador no soporta grabación de audio');
        }

        console.log('🎙️ Solicitando acceso al micrófono...');
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });
        console.log('✅ Acceso al micrófono concedido');
        mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });

          // Mostrar indicador de transcripción
          recordingIndicator.innerHTML = `
            <div class="typing-indicator">
              <span></span><span></span><span></span>
            </div>
            Transcribiendo...
          `;
          recordingIndicator.style.display = 'flex';

          try {
            console.log('🎤 Transcribiendo audio...');
            if (typeof MultimodalModule !== 'undefined') {
              const transcription = await MultimodalModule.transcribeAudio(audioBlob, 'transcribe', (progress) => {
                console.log('📝 Progreso transcripción:', progress);
              });
              chatInput.value = transcription;
              handleInputChange();
              console.log('✅ Transcripción completada:', transcription);
            } else {
              throw new Error('MultimodalModule no está disponible');
            }
          } catch (error) {
            console.error('❌ Error transcribiendo audio:', error);
            alert('Error al transcribir audio: ' + error.message);
          }

          // Ocultar indicador y limpiar
          recordingIndicator.style.display = 'none';
          recordingIndicator.innerHTML = `
            <span class="recording-dot"></span>
            Grabando audio...
          `;
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        isRecording = true;
        recordingIndicator.style.display = 'flex';
        voiceBtn.style.color = '#dc2626';
      } catch (error) {
        console.error('❌ Error accediendo al micrófono:', error);
        console.error('Tipo de error:', error.name);
        console.error('Mensaje:', error.message);

        let errorMessage = 'No se pudo acceder al micrófono.\n\n';

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage += '❌ Permiso denegado.\n\n' +
                         'Para habilitar el micrófono:\n' +
                         '1. Haz clic en el ícono 🔒 en la barra de direcciones\n' +
                         '2. Busca "Micrófono" y cambia a "Permitir"\n' +
                         '3. Recarga el side panel';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage += '❌ No se encontró ningún micrófono.\n\n' +
                         'Verifica que tengas un micrófono conectado.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage += '❌ El micrófono está siendo usado por otra aplicación.\n\n' +
                         'Cierra otras aplicaciones que puedan estar usando el micrófono.';
        } else {
          errorMessage += 'Error: ' + error.message + '\n\n' +
                         'Intenta:\n' +
                         '• Verificar permisos del navegador\n' +
                         '• Recargar la página\n' +
                         '• Usar otro navegador';
        }

        alert(errorMessage);
      }
    } else {
      mediaRecorder.stop();
      isRecording = false;
      recordingIndicator.style.display = 'none';
      voiceBtn.style.color = '';
    }
  }

  /**
   * Guardar historial en storage
   */
  function saveHistory() {
    // Crear copia sin imageFile para poder serializar
    const historyToSave = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      image: msg.image,
      isTyping: msg.isTyping
    }));

    chrome.storage.local.set({
      chatHistory: historyToSave
    });
  }

  /**
   * Cargar historial desde storage
   */
  function loadHistory() {
    chrome.storage.local.get(['chatHistory'], (result) => {
      if (result.chatHistory) {
        conversationHistory = result.chatHistory;
        renderChatHistory();
      }
    });
  }

  /**
   * Agregar mensaje al historial
   */
  function addMessageToHistory(role, content) {
    conversationHistory.push({
      role,
      content,
      timestamp: Date.now()
    });
    renderChatHistory();
    saveHistory();
  }

  console.log('✅ Side Panel Chat inicializado completamente');

  } catch (error) {
    console.error('❌ ERROR FATAL inicializando Side Panel:', error);
    console.error('📍 Stack trace:', error.stack);
    alert('Error inicializando chat: ' + error.message);
  }
})();

console.log('🎬 side_panel.js ejecutado completamente');

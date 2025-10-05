// Side Panel Chat - Lógica del chat en el panel lateral
(function() {
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

  // Cargar historial guardado
  loadHistory();

  // Solicitar datos pendientes al abrir
  requestPendingData();

  // Event listeners
  chatInput.addEventListener('input', handleInputChange);
  chatInput.addEventListener('keydown', handleKeyDown);
  sendBtn.addEventListener('click', sendMessage);
  newChatBtn.addEventListener('click', newConversation);
  voiceBtn.addEventListener('click', toggleVoiceRecording);
  attachImageBtn.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', handleImageSelect);

  /**
   * Solicitar datos pendientes del background
   */
  function requestPendingData() {
    console.log('🔍 Solicitando datos pendientes...');

    chrome.runtime.sendMessage({ action: 'getChatData' }, (response) => {
      console.log('📬 Respuesta del background:', response);

      if (response && response.data) {
        const { selectedText, currentAnswer, action } = response.data;

        console.log('📥 Datos recibidos del diálogo:', {
          selectedText: selectedText?.substring(0, 50) + '...',
          currentAnswer: currentAnswer?.substring(0, 50) + '...',
          action
        });

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
      } else {
        console.log('ℹ️ No hay datos pendientes del diálogo');
      }
    });
  }

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
    const text = chatInput.value.trim();

    if (!text && !attachedImageFile) return;

    // Agregar mensaje del usuario
    const userMessage = {
      role: 'user',
      content: text || 'Imagen adjunta',
      timestamp: Date.now(),
      image: attachedImageFile ? URL.createObjectURL(attachedImageFile) : null,
      imageFile: attachedImageFile
    };

    conversationHistory.push(userMessage);
    renderChatHistory();
    saveHistory();

    // Limpiar input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Limpiar imagen adjunta
    if (attachedImageFile) {
      attachedImageFile = null;
      chatAttachments.innerHTML = '';
      chatAttachments.style.display = 'none';
    }

    // Procesar mensaje con IA
    await processMessage(text, null, userMessage.imageFile);
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

      // Si hay imagen, procesarla con multimodal
      if (imageFile) {
        console.log('🖼️ Procesando imagen con MultimodalModule');
        if (typeof MultimodalModule !== 'undefined') {
          result = await MultimodalModule.describeImage(imageFile, text || 'Describe esta imagen en detalle', onChunk);
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
      // Mostrar estado vacío
      chatMessages.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <h2>Comienza una conversación</h2>
          <p>Escribe un mensaje o usa el botón "Continuar en el chat" desde cualquier diálogo AI</p>
        </div>
      `;
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
    const file = e.target.files[0];
    if (!file) return;

    attachedImageFile = file;
    const imageUrl = URL.createObjectURL(file);

    chatAttachments.innerHTML = `
      <div class="chat-attachment">
        <img src="${imageUrl}" alt="Imagen adjunta">
        <button class="remove-attachment">×</button>
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
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        console.error('Error accediendo al micrófono:', error);
        alert('No se pudo acceder al micrófono');
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
})();

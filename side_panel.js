
(function initSidePanel() {
  try {




  let conversationHistory = [];
  let isRecording = false;
  let mediaRecorder = null;
  let attachedImageFile = null;
  let attachedPdfFile = null;
  let isWebChatMode = false; // Flag to track if we are in page chat mode
  let lastProcessedDataHash = null; // To avoid processing the same data multiple times

  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const newChatBtn = document.getElementById('newChatBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const attachImageBtn = document.getElementById('attachImageBtn');
  const attachPdfBtn = document.getElementById('attachPdfBtn');
  const imageInput = document.getElementById('imageInput');
  const pdfInput = document.getElementById('pdfInput');
  const chatAttachments = document.getElementById('chatAttachments');
  const recordingIndicator = document.getElementById('recordingIndicator');


  

  loadHistory();

  setupSuggestionChips();

  if (chatInput) {
    chatInput.addEventListener('input', handleInputChange);
    chatInput.addEventListener('keydown', handleKeyDown);

  } else {
    console.error('❌ chatInput not found');
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {

      sendMessage();
    });

  } else {
    console.error('❌ sendBtn not found');
  }

  if (newChatBtn) {
    newChatBtn.addEventListener('click', newConversation);

  } else {
    console.error('❌ newChatBtn not found');
  }

    // Button to clear PDF
  const clearPdfBtn = document.getElementById('clearPdfBtn');
  if (clearPdfBtn) {
    clearPdfBtn.addEventListener('click', () => {
      if (confirm('Do you want to remove the loaded PDF? This will not delete the chat history.')) {
        if (typeof WebChatModule !== 'undefined' && WebChatModule.clearPDF) {
          WebChatModule.clearPDF();
          updatePDFIndicator(null);
        }
      }
    });

  } else {
    console.error('❌ clearPdfBtn not found');
  }

  // Button to clear Page
  const clearPageBtn = document.getElementById('clearPageBtn');
  if (clearPageBtn) {
    clearPageBtn.addEventListener('click', () => {
      if (confirm('Do you want to exit Page Chat mode? This will not delete the chat history.')) {
        if (typeof RAGEngine !== 'undefined') {
          const ragEngine = RAGEngine.getInstance();
          ragEngine.clear();
          updatePageIndicator(null);
        }
      }
    });

  } else {
    console.error('❌ clearPageBtn not found');
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {

      toggleVoiceRecording();
    });

  } else {
    console.error('❌ voiceBtn not found');
  }

  if (attachImageBtn) {
    attachImageBtn.addEventListener('click', () => {

      imageInput.click();
    });

  } else {
    console.error('❌ attachImageBtn not found');
  }

  if (attachPdfBtn) {
    attachPdfBtn.addEventListener('click', () => {

      pdfInput.click();
    });

  } else {
    console.error('❌ attachPdfBtn not found');
  }

  if (imageInput) {
    imageInput.addEventListener('change', handleImageSelect);

  } else {
    console.error('❌ imageInput not found');
  }

  if (pdfInput) {
    pdfInput.addEventListener('change', handlePdfSelect);

  } else {
    console.error('❌ pdfInput not found');
  }

  /**
   * Setup suggestion chips
   */
  function setupSuggestionChips() {
    const chips = document.querySelectorAll('.suggestion-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const suggestion = chip.dataset.suggestion;
        
        // If it's the suggestion to upload PDF, open the file selector
        if (suggestion === 'Upload a PDF to chat with it') {
          pdfInput.click();
          return;
        }
        
        chatInput.value = suggestion;
        chatInput.focus();
        handleInputChange();
        // Optionally send automatically
        // sendMessage();
      });
    });
  }

  /**
   * Request pending data from background script
   */
  function requestPendingData() {

    // Try multiple times with incremental delays
    let attempts = 0;
    const maxAttempts = 3;
    
    async function tryRequest() {
      attempts++;

      chrome.runtime.sendMessage({ action: 'getChatData' }, async (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error requesting data:', chrome.runtime.lastError);
          
          // Retry if we haven't reached the maximum
          if (attempts < maxAttempts) {
            setTimeout(tryRequest, 500 * attempts);
          }
          return;
        }

        if (response && response.data) {

            

          // Process the received data
          await handleChatData(response.data);
        } else {

          // Retry if we haven't reached the maximum
          if (attempts < maxAttempts) {
            setTimeout(tryRequest, 300 * attempts);
          }
        }
      });
    }
    
    // Start with a longer delay to give time for the background to save the data
    // and the side panel to finish loading completely
    setTimeout(tryRequest, 300);
  }

  /**
   * Handle chat data from background or content script
   */
  async function handleChatData(data) {



    if (!data) {
      console.warn('⚠️ handleChatData received empty data');
      return;
    }

    // Create a unique hash for this data
    const dataHash = JSON.stringify({
      imageUrl: data.imageUrl,
      imageAction: data.imageAction,
      prompt: data.prompt,
      selectedText: data.selectedText,
      context: data.context,
      timestamp: Math.floor(Date.now() / 1000) // Group by second
    });

    // Check if we already processed this same data recently (in the last second)
    if (lastProcessedDataHash === dataHash) {
      console.warn('⚠️ Duplicate data detected - ignoring processing');
      return;
    }

    // Save the hash to avoid duplicates
    lastProcessedDataHash = dataHash;
    
    // Clear the hash after 2 seconds
    setTimeout(() => {
      if (lastProcessedDataHash === dataHash) {
        lastProcessedDataHash = null;
      }
    }, 2000);

    const { selectedText, currentAnswer, action, followupQuestion, webChatMode, pageTitle, pageUrl, pageContent, imageMode, imageUrl, imageAction, prompt, initialPrompt, context } = data;


      



     

    // For images, always clear history to create new conversation
    if (imageMode && imageUrl && prompt) {

      conversationHistory = [];
    }
    // For page chat (from context menu), clear history
    else if (context === 'page-chat' && webChatMode) {

      conversationHistory = [];
    }
    // For page summary, DO NOT clear if content is already loading
    else if (context === 'page-summary-loading' || context === 'page-summary') {

      // Do not clear history here
    }
    // For other cases, only clear if it's not a follow-up question
    else if (!followupQuestion) {


      conversationHistory = [];

    }

    // MODE: Page summary - Loading state
    if (context === 'page-summary-loading' && data.isLoading) {

      // Activate web chat mode flag
      isWebChatMode = true;
      
      // Show page indicator
      updatePageIndicator({
        title: pageTitle || 'Web page',
        url: pageUrl
      });
      
      // Add assistant message with typing indicator
      conversationHistory.push({
        role: 'assistant',
        content: '', // Empty content
        isLoading: true, // Special flag to show typing indicator
        timestamp: Date.now()
      });

      renderChatHistory();
      saveHistory();

      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);

      return;
    }

    // MODE: Page summary (from floating button)
    if (context === 'page-summary' && currentAnswer) {






      // Activar flag de web chat mode
      isWebChatMode = true;
      
      // **IMPORTANTE**: Indexar el contenido de la página en el RAG Engine del side panel

      if (typeof WebChatModule !== 'undefined' && pageContent) {
        try {

          // First set the content in the module
          WebChatModule.setPageContent(pageContent, {
            title: pageTitle,
            url: pageUrl
          });

          // Then index
          await WebChatModule.initializeRAG();

        } catch (error) {
          console.error('❌ Error indexando contenido en side panel:', error);
        }
      } else {
        console.warn('⚠️ Cannot index:', {
          hasWebChatModule: typeof WebChatModule !== 'undefined',
          hasPageContent: !!pageContent
        });
      }
      
      // Asegurar que el indicador de página esté visible
      updatePageIndicator({
  title: pageTitle || 'Web page',
        url: pageUrl
      });
      
      // Buscar si hay un mensaje de carga pendiente y reemplazarlo
      const loadingMessageIndex = conversationHistory.findIndex(msg => msg.isLoading);
      
      if (loadingMessageIndex !== -1) {

  // Replace loading message with summary
        conversationHistory[loadingMessageIndex] = {
          role: 'assistant',
          content: currentAnswer,
          timestamp: Date.now()
        };
      } else {

        // Add user message (automatic)
        const userMessage = `Summarize this page: ${pageTitle}`;

        conversationHistory.push({
          role: 'user',
          content: userMessage,
          timestamp: Date.now()
        });

        // Add summary as assistant response

        conversationHistory.push({
          role: 'assistant',
          content: currentAnswer,
          timestamp: Date.now()
        });
      }

      // Renderizar historial

      renderChatHistory();

      saveHistory();

      // Scroll to bottom
      setTimeout(() => {

        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);

      return;
    }

    // MODO: Imagen (OCR, Explain, Describe)
    if (imageMode && imageUrl && prompt) {



      // Cargar la imagen
      fetch(imageUrl)
        .then(res => res.blob())
        .then(async (blob) => {
          const imageFile = new File([blob], 'image.jpg', { type: blob.type });
          const imageObjectUrl = URL.createObjectURL(blob);



          // Agregar mensaje del usuario con el prompt
          conversationHistory.push({
            role: 'user',
            content: prompt,
            image: imageObjectUrl,
            imageFile: imageFile,
            imageAction: imageAction || 'describe', // Asegurar que imageAction tenga un valor
            timestamp: Date.now()
          });


          // Renderizar historial
          renderChatHistory();
          saveHistory();

          // Hacer scroll al final
          setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }, 100);

          // Procesar automáticamente con la acción correcta


          setTimeout(() => {
            processMessage(prompt, imageAction, imageFile, null);
          }, 200);
        })
        .catch(err => {
          console.error('❌ Error cargando imagen:', err);
          alert('Error loading image: ' + err.message);
        });

      return;
    }

    // MODO: Chat con selección de texto
    if (selectedText) {

      // Si ya hay una respuesta (ej: desde el toolbar), mostrarla
      if (currentAnswer) {
        conversationHistory.push({
          role: 'user',
          content: `${action === 'summarize' ? 'Summary' : action === 'translate' ? 'Translation' : action === 'explain' ? 'Explanation' : 'Query'}: ${selectedText}`,
          timestamp: Date.now()
        });

        conversationHistory.push({
          role: 'assistant',
          content: currentAnswer,
          timestamp: Date.now()
        });

        renderChatHistory();
        saveHistory();

        setTimeout(() => {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
      }

      // Si hay una pregunta de seguimiento, procesarla
      if (followupQuestion) {
        setTimeout(() => {
          chatInput.value = followupQuestion;
          processMessage(followupQuestion);
        }, 500);
      }

      return;
    }

    // MODO: Chat con página web (desde menú contextual)
    if (webChatMode && pageContent) {

      // Activar flag de web chat mode
      isWebChatMode = true;
      
      // Mostrar indicador de página
      if (pageTitle || pageUrl) {
        updatePageIndicator({
          title: pageTitle || 'Web page',
          url: pageUrl
        });
      }
      
      // **IMPORTANTE**: Indexar el contenido de la página en el RAG Engine

      if (typeof WebChatModule !== 'undefined') {
        try {

          // Primero establecer el contenido en el módulo
          WebChatModule.setPageContent(pageContent, {
            title: pageTitle,
            url: pageUrl
          });

          // Luego indexar
          await WebChatModule.initializeRAG();

        } catch (error) {
          console.error('❌ Error indexando contenido:', error);
        }
      }
      
      // Si viene del menú contextual (context: 'page-chat'), generar resumen automático
      if (context === 'page-chat') {

        // Agregar mensaje del usuario (automático)
        const userMessage = `Summarize this page: ${pageTitle}`;
        conversationHistory.push({
          role: 'user',
          content: userMessage,
          timestamp: Date.now()
        });
        
        // Agregar mensaje de carga
        conversationHistory.push({
          role: 'assistant',
          content: '',
          isLoading: true,
          timestamp: Date.now()
        });
        
        // Renderizar para mostrar el indicador de carga
        renderChatHistory();
        saveHistory();
        
        // Generar el resumen de forma asíncrona
        setTimeout(async () => {
          try {

            const summary = await WebChatModule.summarizePage();

            // Reemplazar el mensaje de carga con el resumen
            const loadingIndex = conversationHistory.findIndex(msg => msg.isLoading);
            if (loadingIndex !== -1) {
              conversationHistory[loadingIndex] = {
                role: 'assistant',
                content: summary,
                timestamp: Date.now()
              };
              
              renderChatHistory();
              saveHistory();
              
              // Scroll al final
              setTimeout(() => {
                chatMessages.scrollTop = chatMessages.scrollHeight;
              }, 100);
            }
          } catch (error) {
            console.error('❌ Error generando resumen:', error);
            
            // Reemplazar mensaje de carga con error
            const loadingIndex = conversationHistory.findIndex(msg => msg.isLoading);
            if (loadingIndex !== -1) {
              conversationHistory[loadingIndex] = {
                role: 'assistant',
                content: '❌ Error generating the summary. Please try asking something about the page.',
                timestamp: Date.now()
              };
              renderChatHistory();
              saveHistory();
            }
          }
        }, 100);
      }
      
      return;
    }
  }

  // Listener to receive data from dialog
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {


      

    if (request.action === 'chatData' && request.data) {

      // Llamar handleChatData de forma async pero responder inmediatamente
      handleChatData(request.data).then(() => {

      }).catch(error => {
        console.error('❌ Error processing chatData:', error);
      });
      
      // Responder inmediatamente para que content.js sepa que el mensaje fue recibido
      sendResponse({ success: true });
      return true; // Mantener el canal abierto para sendResponse async
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
    sendBtn.disabled = !chatInput.value.trim() && !attachedImageFile && !attachedPdfFile;
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

    if (!text && !attachedImageFile && !attachedPdfFile) {

      return;
    }

    // Obtener acción seleccionada para imagen si existe
    let imageAction = null;
    if (attachedImageFile) {
      const imageActionSelect = document.getElementById('imageActionSelect');
      imageAction = imageActionSelect ? imageActionSelect.value : 'describe';
    }

    // Agregar mensaje del usuario
    const userMessage = {
      role: 'user',
      content: text || (attachedImageFile ? `Imagen adjunta (${imageAction})` : 'PDF adjunto'),
      timestamp: Date.now(),
      image: attachedImageFile ? URL.createObjectURL(attachedImageFile) : null,
      imageFile: attachedImageFile,
      imageAction: imageAction,
      pdfFile: attachedPdfFile
    };

    conversationHistory.push(userMessage);
    renderChatHistory();
    saveHistory();

    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Save references before clearing
    const imageFile = attachedImageFile;
    const pdfFile = attachedPdfFile;
    const action = imageAction;

    // Clear attachments
    if (attachedImageFile) {
      attachedImageFile = null;
    }
    if (attachedPdfFile) {
      attachedPdfFile = null;
    }
    chatAttachments.innerHTML = '';
    chatAttachments.style.display = 'none';

    // Process message with AI
    await processMessage(text, action, imageFile, pdfFile);
  }

  /**
   * Procesar mensaje con IA
   */
  async function processMessage(text, action = null, imageFile = null, pdfFile = null) {
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

      // Callback para progreso
      const onProgress = (progress) => {

        assistantMessage.content = `⏳ ${progress}`;
        renderChatHistory();
      };

      // Check if we are in page chat or PDF mode using the flag




      const hasPDF = typeof WebChatModule !== 'undefined' && WebChatModule.hasPDFLoaded && WebChatModule.hasPDFLoaded();

      const hasRAGContent = isWebChatMode || hasPDF;





      // Si hay PDF, procesarlo
      if (pdfFile) {

        if (typeof WebChatModule !== 'undefined') {
          // Subir PDF al chat
          await WebChatModule.uploadPDF(pdfFile, onProgress);
          
          // Update PDF indicator
          updatePDFIndicator({
            filename: pdfFile.name,
            size: pdfFile.size
          });
          
          // Si hay texto, procesarlo como pregunta sobre el PDF
          if (text && text.trim()) {

            result = await WebChatModule.chatWithPage(text, onProgress);
            assistantMessage.content = result;
          } else {
            result = `✅ PDF "${pdfFile.name}" cargado exitosamente. Ahora puedes hacer preguntas sobre su contenido.`;
            assistantMessage.content = result;
          }
          assistantMessage.isTyping = false;
        } else {
          throw new Error('WebChatModule is not available');
        }
      }
      // Si hay imagen, procesarla con multimodal según la acción
      else if (imageFile) {

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
      // Si estamos en modo chat con página o PDF, usar RAG
      else if (hasRAGContent && typeof WebChatModule !== 'undefined') {





        result = await WebChatModule.chatWithPage(text, onProgress);





        assistantMessage.content = result;
        assistantMessage.isTyping = false;
      }
      // Si hay una acción específica, usar streaming
      else if (action) {

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
          <h2>Start a conversation</h2>
          <p>Type a message or use the "Continue in chat" button from any AI dialog</p>
          <div class="suggestion-chips">
            <button class="suggestion-chip" data-suggestion="Help me write a professional email">
              ✉️ Write email
            </button>
            <button class="suggestion-chip" data-suggestion="Summarize this text in 3 key points">
              📝 Summarize text
            </button>
            <button class="suggestion-chip" data-suggestion="Translate this text to English">
              🌐 Translate
            </button>
            <button class="suggestion-chip" data-suggestion="Explain this concept in simple terms">
              💡 Explain
            </button>
          </div>
        </div>
      `;
      // Re-setup suggestion chips después de renderizar
      setupSuggestionChips();
      return;
    }

    // Renderizar cada mensaje (skip system messages)
    conversationHistory.forEach((msg, index) => {
      // Skip system messages from rendering
      if (msg.role === 'system') return;

      const messageEl = document.createElement('div');
      messageEl.className = `message ${msg.role}-message`;

  const avatar = msg.role === 'user' ? 'U' : '<div class="ai-avatar" style="width: 100%; height: 100%; font-size: 16px;"><div class="eyes"><span></span><span></span></div></div>';
  const roleName = msg.role === 'user' ? 'You' : 'Assistant';
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
          ${msg.isTyping || msg.isLoading ? '<div class="typing-indicator"><span></span><span></span><span></span></div>' : ''}
        </div>
        ${msg.pdfFile ? `<div class="message-attachment pdf-attachment">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <text x="7" y="17" font-size="6" fill="currentColor" font-weight="bold">PDF</text>
          </svg>
          <span>${msg.pdfFile.name}</span>
          <span class="pdf-size">${(msg.pdfFile.size / 1024).toFixed(1)} KB</span>
        </div>` : ''}
        ${msg.image ? `<img src="${msg.image}" class="message-image" alt="Imagen adjunta">` : ''}
      `;

      chatMessages.appendChild(messageEl);

      // Renderizar contenido con Markdown si no está escribiendo ni cargando
      if (!msg.isTyping && !msg.isLoading && msg.content) {
        const contentEl = messageEl.querySelector('.message-content');
        if (typeof MarkdownRenderer !== 'undefined') {
          MarkdownRenderer.renderToElement(contentEl, msg.content);
        } else {
          contentEl.textContent = msg.content;
        }
      }

      // Agregar botones de acción para mensajes del asistente
      if (msg.role === 'assistant' && !msg.isTyping && !msg.isLoading) {
        const actionsEl = document.createElement('div');
        actionsEl.className = 'message-actions';
        actionsEl.innerHTML = `
          <button class="message-action-btn copy-btn" data-index="${index}" title="Copy">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
          </button>
          <button class="message-action-btn regenerate-btn" data-index="${index}" title="Regenerate">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
          <button class="message-action-btn speak-btn" data-index="${index}" title="Speak">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
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
   * Update PDF indicator in header
   */
  function updatePDFIndicator(pdfInfo) {
    const pdfIndicator = document.getElementById('pdfIndicator');
    const pdfIndicatorText = document.getElementById('pdfIndicatorText');
    const clearPdfBtn = document.getElementById('clearPdfBtn');
    const pageIndicator = document.getElementById('pageIndicator');
    const clearPageBtn = document.getElementById('clearPageBtn');

    if (pdfInfo) {
      // Show PDF indicator, hide page indicator
      if (pdfIndicator) {
        pdfIndicator.style.display = 'inline-flex';
        pdfIndicatorText.textContent = pdfInfo.filename || 'PDF';
      }
      if (clearPdfBtn) {
        clearPdfBtn.style.display = 'block';
      }
      if (pageIndicator) {
        pageIndicator.style.display = 'none';
      }
      if (clearPageBtn) {
        clearPageBtn.style.display = 'none';
      }

    } else {
      // Hide PDF indicator
      if (pdfIndicator) {
        pdfIndicator.style.display = 'none';
      }
      if (clearPdfBtn) {
        clearPdfBtn.style.display = 'none';
      }

    }
  }

  /**
   * Update Page indicator in header
   */
  function updatePageIndicator(pageInfo) {
    const pageIndicator = document.getElementById('pageIndicator');
    const pageIndicatorText = document.getElementById('pageIndicatorText');
    const clearPageBtn = document.getElementById('clearPageBtn');
    const pdfIndicator = document.getElementById('pdfIndicator');
    const clearPdfBtn = document.getElementById('clearPdfBtn');

    if (pageInfo) {
      // Show page indicator, hide PDF indicator
      if (pageIndicator) {
        pageIndicator.style.display = 'inline-flex';
        pageIndicatorText.textContent = pageInfo.title || 'Página';
      }
      if (clearPageBtn) {
        clearPageBtn.style.display = 'block';
      }
      if (pdfIndicator) {
        pdfIndicator.style.display = 'none';
      }
      if (clearPdfBtn) {
        clearPdfBtn.style.display = 'none';
      }

    } else {
      // Hide page indicator
      if (pageIndicator) {
        pageIndicator.style.display = 'none';
      }
      if (clearPageBtn) {
        clearPageBtn.style.display = 'none';
      }

    }
  }

  /**
   * New conversation
   */
  function newConversation() {
    if (confirm('Do you want to start a new conversation? Current history will be deleted.')) {
      conversationHistory = [];
      isWebChatMode = false; // Reset web chat mode flag
      saveHistory();
      renderChatHistory();
      
      // Clear PDF if loaded
      if (typeof WebChatModule !== 'undefined') {
        WebChatModule.clearCurrentPDF();
        WebChatModule.clearPageContent(); // También limpiar contenido de página
        updatePDFIndicator(null);
        updatePageIndicator(null); // Limpiar indicador de página
      }
    }
  }

  /**
   * Manejar selección de imagen
   */
  function handleImageSelect(e) {

    const file = e.target.files[0];
    if (!file) {

      return;
    }

    attachedImageFile = file;
    const imageUrl = URL.createObjectURL(file);

    chatAttachments.innerHTML = `
      <div class="chat-attachment">
        <div style="position: relative;">
          <img src="${imageUrl}" alt="Attached image">
          <button class="remove-attachment">×</button>
        </div>
        <select class="image-action-select" id="imageActionSelect">
          <option value="describe">Describe image</option>
          <option value="summarize">Summarize content</option>
          <option value="translate">Translate text</option>
          <option value="explain">Explain image</option>
          <option value="alttext">Generate alt text</option>
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
   * Manejar selección de PDF
   */
  function handlePdfSelect(e) {

    const file = e.target.files[0];
    if (!file) {

      return;
    }

    attachedPdfFile = file;

    // Mostrar información del PDF
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    chatAttachments.innerHTML = `
      <div class="pdf-attachment">
        <div class="pdf-attachment-icon">PDF</div>
        <div class="pdf-attachment-info">
          <div class="pdf-attachment-name">${file.name}</div>
          <div class="pdf-attachment-details">${fileSize} MB</div>
        </div>
        <div class="pdf-attachment-actions">
          <button class="pdf-attachment-btn" id="uploadPdfBtn">Upload</button>
          <button class="pdf-attachment-btn" id="removePdfBtn">×</button>
        </div>
      </div>
    `;
    chatAttachments.style.display = 'flex';

    // Event listeners para los botones
    document.getElementById('uploadPdfBtn').addEventListener('click', async () => {
      await uploadPdfToChat(file);
    });

    document.getElementById('removePdfBtn').addEventListener('click', () => {
      attachedPdfFile = null;
      chatAttachments.innerHTML = '';
      chatAttachments.style.display = 'none';
      pdfInput.value = '';
      sendBtn.disabled = !chatInput.value.trim();
    });

    sendBtn.disabled = false;
  }

  /**
   * Upload PDF to chat
   */
  async function uploadPdfToChat(pdfFile) {
    try {

      // Mostrar mensaje de progreso
  const progressMessage = addMessage('assistant', 'Processing PDF...', true);
      
      // Subir PDF usando WebChatModule
      const result = await WebChatModule.uploadPDF(pdfFile, (progress) => {
        updateMessageContent(progressMessage, progress);
      });

      // Actualizar mensaje final
  updateMessageContent(progressMessage, `✅ PDF uploaded successfully: ${result.filename} (${result.pages} pages)`);
      
      // Actualizar UI para mostrar PDF cargado
      updatePdfAttachmentUI(result);
      
      // Limpiar input
      pdfInput.value = '';

    } catch (error) {
      console.error('❌ Error subiendo PDF:', error);
  addMessage('assistant', `❌ Error processing PDF: ${error.message}`);
    }
  }

  /**
   * Update PDF attachment UI after successful upload
   */
  function updatePdfAttachmentUI(pdfInfo) {
    chatAttachments.innerHTML = `
      <div class="pdf-attachment" style="border-color: #10b981;">
        <div class="pdf-attachment-icon" style="background: #10b981;">✓</div>
        <div class="pdf-attachment-info">
          <div class="pdf-attachment-name">${pdfInfo.filename}</div>
          <div class="pdf-attachment-details">${pdfInfo.pages} pages • Ready to chat</div>
        </div>
        <div class="pdf-attachment-actions">
          <button class="pdf-attachment-btn" id="clearPdfBtn">Clear</button>
        </div>
      </div>
    `;

    document.getElementById('clearPdfBtn').addEventListener('click', () => {
      WebChatModule.clearCurrentPDF();
      attachedPdfFile = null;
      chatAttachments.innerHTML = '';
      chatAttachments.style.display = 'none';
      pdfInput.value = '';
      sendBtn.disabled = !chatInput.value.trim();
      addMessage('assistant', '📄 PDF removed. You can now chat with the current web page.');
    });
  }

  /**
   * Display attached image (for image mode from context menu)
   */
  function displayAttachedImage(blob) {
    const imageUrl = URL.createObjectURL(blob);

    chatAttachments.innerHTML = `
      <div class="chat-attachment">
        <div style="position: relative;">
          <img src="${imageUrl}" alt="Attached image">
        </div>
      </div>
    `;
    chatAttachments.style.display = 'flex';
  }

  /**
   * Toggle grabación de voz
   */
  async function toggleVoiceRecording() {

    if (!isRecording) {
      try {
        // Verificar si getUserMedia está disponible
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Your browser does not support audio recording');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          }
        });

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
            Transcribing...
          `;
          recordingIndicator.style.display = 'flex';

          try {

            if (typeof MultimodalModule !== 'undefined') {
              const transcription = await MultimodalModule.transcribeAudio(audioBlob, 'transcribe', (progress) => {

              });
              chatInput.value = transcription;
              handleInputChange();

            } else {
              throw new Error('MultimodalModule is not available');
            }
          } catch (error) {
            console.error('❌ Error transcribing audio:', error);
            alert('Error transcribing audio: ' + error.message);
          }

          // Ocultar indicador y limpiar
          recordingIndicator.style.display = 'none';
          recordingIndicator.innerHTML = `
            <span class="recording-dot"></span>
            Recording audio...
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

        let errorMessage = 'Could not access the microphone.\n\n';

        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage += '❌ Permission denied.\n\n' +
                         'To enable the microphone:\n' +
                         '1. Click the 🔒 icon in the address bar\n' +
                         '2. Find "Microphone" and set to "Allow"\n' +
                         '3. Reload the side panel';
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          errorMessage += '❌ No microphone found.\n\n' +
                         'Make sure you have a microphone connected.';
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          errorMessage += '❌ The microphone is being used by another application.\n\n' +
                         'Close other applications that may be using the microphone.';
        } else {
          errorMessage += 'Error: ' + error.message + '\n\n' +
                         'Try:\n' +
                         '• Check browser permissions\n' +
                         '• Reload the page\n' +
                         '• Use another browser';
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
      
      // Check if there's a PDF loaded
      if (typeof WebChatModule !== 'undefined') {
        const pdfInfo = WebChatModule.getCurrentPDFInfo();
        if (pdfInfo) {
          updatePDFIndicator(pdfInfo);
        }
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

  // Solicitar datos pendientes del background script (después de que todo esté listo)

  requestPendingData();

  } catch (error) {
    console.error('❌ ERROR FATAL inicializando Side Panel:', error);
    console.error('📍 Stack trace:', error.stack);
    alert('Error inicializando chat: ' + error.message);
  }
})();

// Listener adicional para cuando el documento esté completamente listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {

  });
} else {

}

// Listener para visibilidad de la página (cuando el side panel se abre/cierra)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {

    // Podría haber datos pendientes si el panel se cerró y reabrió
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'getChatData' }, (response) => {
        if (response && response.data) {

        }
      });
    }, 100);
  } else {

  }
});



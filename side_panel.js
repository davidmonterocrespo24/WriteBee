console.log('📜 side_panel.js loaded - starting execution');

(function initSidePanel() {
  try {
    console.log('🚀 Initializing Side Panel Chat');
    console.log('⏰ Timestamp:', Date.now());
    console.log('📄 Document ready state:', document.readyState);

    console.log('📦 Available modules:', {
      AIModule: typeof AIModule !== 'undefined',
      MultimodalModule: typeof MultimodalModule !== 'undefined',
      MarkdownRenderer: typeof MarkdownRenderer !== 'undefined',
      AIServiceInstance: typeof window.AIServiceInstance !== 'undefined'
    });

  let conversationHistory = [];
  let isRecording = false;
  let mediaRecorder = null;
  let attachedImageFile = null;
  let attachedPdfFile = null;
  let isWebChatMode = false; // Flag para trackear si estamos en modo chat con página
  let lastProcessedDataHash = null; // Para evitar procesar los mismos datos múltiples veces

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

  console.log('✅ DOM elements loaded:', {
    chatMessages: !!chatMessages,
    chatInput: !!chatInput,
    sendBtn: !!sendBtn,
    imageInput: !!imageInput,
    pdfInput: !!pdfInput,
    voiceBtn: !!voiceBtn,
    attachImageBtn: !!attachImageBtn,
    attachPdfBtn: !!attachPdfBtn
  });

  loadHistory();

  setupSuggestionChips();

  if (chatInput) {
    chatInput.addEventListener('input', handleInputChange);
    chatInput.addEventListener('keydown', handleKeyDown);
    console.log('✅ Event listeners added to chatInput');
  } else {
    console.error('❌ chatInput not found');
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      console.log('🔵 Click on sendBtn detected');
      sendMessage();
    });
    console.log('✅ Event listener added to sendBtn');
  } else {
    console.error('❌ sendBtn not found');
  }

  if (newChatBtn) {
    newChatBtn.addEventListener('click', newConversation);
    console.log('✅ Event listener added to newChatBtn');
  } else {
    console.error('❌ newChatBtn not found');
  }

    // Botón para limpiar PDF
  const clearPdfBtn = document.getElementById('clearPdfBtn');
  if (clearPdfBtn) {
    clearPdfBtn.addEventListener('click', () => {
      if (confirm('¿Quieres eliminar el PDF cargado? Esto no borrará el historial de chat.')) {
        if (typeof WebChatModule !== 'undefined' && WebChatModule.clearPDF) {
          WebChatModule.clearPDF();
          updatePDFIndicator(null);
        }
      }
    });
    console.log('✅ Event listener added to clearPdfBtn');
  } else {
    console.error('❌ clearPdfBtn not found');
  }

  // Botón para limpiar Página
  const clearPageBtn = document.getElementById('clearPageBtn');
  if (clearPageBtn) {
    clearPageBtn.addEventListener('click', () => {
      if (confirm('¿Quieres salir del modo Chat con Página? Esto no borrará el historial de chat.')) {
        if (typeof RAGEngine !== 'undefined') {
          const ragEngine = RAGEngine.getInstance();
          ragEngine.clear();
          updatePageIndicator(null);
        }
      }
    });
    console.log('✅ Event listener added to clearPageBtn');
  } else {
    console.error('❌ clearPageBtn not found');
  }

  if (voiceBtn) {
    voiceBtn.addEventListener('click', () => {
      console.log('🔵 Click on voiceBtn detected');
      toggleVoiceRecording();
    });
    console.log('✅ Event listener added to voiceBtn');
  } else {
    console.error('❌ voiceBtn not found');
  }

  if (attachImageBtn) {
    attachImageBtn.addEventListener('click', () => {
      console.log('🔵 Click on attachImageBtn detected');
      imageInput.click();
    });
    console.log('✅ Event listener added to attachImageBtn');
  } else {
    console.error('❌ attachImageBtn not found');
  }

  if (attachPdfBtn) {
    attachPdfBtn.addEventListener('click', () => {
      console.log('🔵 Click on attachPdfBtn detected');
      pdfInput.click();
    });
    console.log('✅ Event listener added to attachPdfBtn');
  } else {
    console.error('❌ attachPdfBtn not found');
  }

  if (imageInput) {
    imageInput.addEventListener('change', handleImageSelect);
    console.log('✅ Event listener added to imageInput');
  } else {
    console.error('❌ imageInput not found');
  }

  if (pdfInput) {
    pdfInput.addEventListener('change', handlePdfSelect);
    console.log('✅ Event listener added to pdfInput');
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
        
        // Si es la sugerencia de subir PDF, abrir el selector de archivos
        if (suggestion === 'Sube un PDF para chatear con él') {
          pdfInput.click();
          return;
        }
        
        chatInput.value = suggestion;
        chatInput.focus();
        handleInputChange();
        // Opcionalmente enviar automáticamente
        // sendMessage();
      });
    });
  }

  /**
   * Request pending data from background script
   */
  function requestPendingData() {
    console.log('📨 Solicitando datos pendientes al background...');
    
    // Intentar múltiples veces con delays incrementales
    let attempts = 0;
    const maxAttempts = 3;
    
    async function tryRequest() {
      attempts++;
      console.log(`📨 Intento ${attempts}/${maxAttempts} de solicitar datos...`);
      
      chrome.runtime.sendMessage({ action: 'getChatData' }, async (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Error solicitando datos:', chrome.runtime.lastError);
          
          // Reintentar si no hemos alcanzado el máximo
          if (attempts < maxAttempts) {
            setTimeout(tryRequest, 500 * attempts);
          }
          return;
        }

        if (response && response.data) {
          console.log('📥 Datos pendientes recibidos:', {
            action: response.data.action,
            context: response.data.context,
            hasCurrentAnswer: !!response.data.currentAnswer,
            currentAnswerPreview: response.data.currentAnswer?.substring(0, 100),
            hasPageContent: !!response.data.pageContent,
            hasSelectedText: !!response.data.selectedText,
            pageTitle: response.data.pageTitle
          });

          // Procesar los datos recibidos
          await handleChatData(response.data);
        } else {
          console.log('ℹ️ No hay datos pendientes');
          
          // Reintentar si no hemos alcanzado el máximo
          if (attempts < maxAttempts) {
            setTimeout(tryRequest, 300 * attempts);
          }
        }
      });
    }
    
    // Comenzar con un delay más largo para dar tiempo a que el background guarde los datos
    // y el side panel termine de cargar completamente
    setTimeout(tryRequest, 300);
  }

  /**
   * Handle chat data from background or content script
   */
  async function handleChatData(data) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 HANDLE CHAT DATA LLAMADO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (!data) {
      console.warn('⚠️ handleChatData recibió datos vacíos');
      return;
    }

    // Crear un hash único para estos datos
    const dataHash = JSON.stringify({
      imageUrl: data.imageUrl,
      imageAction: data.imageAction,
      prompt: data.prompt,
      selectedText: data.selectedText,
      context: data.context,
      timestamp: Math.floor(Date.now() / 1000) // Agrupar por segundo
    });

    // Verificar si ya procesamos estos mismos datos recientemente (en el último segundo)
    if (lastProcessedDataHash === dataHash) {
      console.warn('⚠️ Datos duplicados detectados - ignorando procesamiento');
      return;
    }

    // Guardar el hash para evitar duplicados
    lastProcessedDataHash = dataHash;
    
    // Limpiar el hash después de 2 segundos
    setTimeout(() => {
      if (lastProcessedDataHash === dataHash) {
        lastProcessedDataHash = null;
      }
    }, 2000);

    const { selectedText, currentAnswer, action, followupQuestion, webChatMode, pageTitle, pageUrl, pageContent, imageMode, imageUrl, imageAction, prompt, initialPrompt, context } = data;

    console.log('📋 Datos extraídos:', {
      selectedText: selectedText?.substring(0, 50),
      currentAnswer: currentAnswer?.substring(0, 50),
      action,
      followupQuestion,
      webChatMode,
      pageTitle,
      pageUrl: pageUrl?.substring(0, 50),
      pageContentLength: pageContent?.length,
      imageMode,
      imageUrl: imageUrl?.substring(0, 50),
      imageAction,
      context
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📥 HANDLE CHAT DATA: Procesando datos de chat');
    console.log('📋 Datos recibidos:', {
      selectedText: selectedText?.substring(0, 50),
      currentAnswer: currentAnswer ? `${currentAnswer.substring(0, 100)}...` : 'N/A',
      action,
      followupQuestion: followupQuestion?.substring(0, 50),
      webChatMode,
      pageTitle,
      pageUrl,
      pageContentLength: pageContent?.length,
      imageMode,
      imageAction,
      imageUrl: imageUrl?.substring(0, 50),
      initialPrompt: initialPrompt?.substring(0, 50),
      context
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Para imágenes, siempre limpiar el historial para crear nueva conversación
    if (imageMode && imageUrl && prompt) {
      console.log('🖼️ Modo imagen detectado - limpiando historial para nueva conversación');
      conversationHistory = [];
    }
    // Para chat con página (desde menú contextual), limpiar historial
    else if (context === 'page-chat' && webChatMode) {
      console.log('🌐 Modo chat con página detectado - limpiando historial para nueva conversación');
      conversationHistory = [];
    }
    // Para resumen de página, NO limpiar si ya hay contenido cargando
    else if (context === 'page-summary-loading' || context === 'page-summary') {
      console.log('📄 Resumen de página - manteniendo o actualizando historial');
      // No limpiar el historial aquí
    }
    // Para otros casos, solo limpiar si no es una pregunta de seguimiento
    else if (!followupQuestion) {
      console.log('🆕 Iniciando nueva conversación');
      console.log('🧹 Limpiando historial anterior:', conversationHistory.length, 'mensajes');
      conversationHistory = [];
      console.log('✅ Historial limpiado, listo para nueva conversación');
    }

    // MODO: Resumen de página - Estado de carga
    if (context === 'page-summary-loading' && data.isLoading) {
      console.log('⏳ Mostrando estado de carga del resumen...');
      
      // Activar flag de web chat mode
      isWebChatMode = true;
      
      // Mostrar indicador de página
      updatePageIndicator({
        title: pageTitle || 'Página web',
        url: pageUrl
      });
      
      // Agregar mensaje del asistente con typing indicator
      conversationHistory.push({
        role: 'assistant',
        content: '', // Contenido vacío
        isLoading: true, // Bandera especial para mostrar typing indicator
        timestamp: Date.now()
      });

      renderChatHistory();
      saveHistory();

      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);

      return;
    }

    // MODO: Resumen de página (desde el botón flotante)
    if (context === 'page-summary' && currentAnswer) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📄 MODO RESUMEN DE PÁGINA ACTIVADO');
      console.log('📝 Página:', pageTitle);
      console.log('📊 Resumen length:', currentAnswer.length);
      console.log('📊 pageContent length:', pageContent?.length);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Activar flag de web chat mode
      isWebChatMode = true;
      
      // **IMPORTANTE**: Indexar el contenido de la página en el RAG Engine del side panel
      console.log('🔄 Indexando contenido de la página en RAG Engine del side panel...');
      if (typeof WebChatModule !== 'undefined' && pageContent) {
        try {
          console.log('📝 Estableciendo pageContent en WebChatModule...');
          // Primero establecer el contenido en el módulo
          WebChatModule.setPageContent(pageContent, {
            title: pageTitle,
            url: pageUrl
          });
          
          console.log('🔄 Llamando a initializeRAG()...');
          // Luego indexar
          await WebChatModule.initializeRAG();
          console.log('✅ Contenido indexado exitosamente en RAG Engine del side panel');
        } catch (error) {
          console.error('❌ Error indexando contenido en side panel:', error);
        }
      } else {
        console.warn('⚠️ No se puede indexar:', {
          hasWebChatModule: typeof WebChatModule !== 'undefined',
          hasPageContent: !!pageContent
        });
      }
      
      // Asegurar que el indicador de página esté visible
      updatePageIndicator({
        title: pageTitle || 'Página web',
        url: pageUrl
      });
      
      // Buscar si hay un mensaje de carga pendiente y reemplazarlo
      const loadingMessageIndex = conversationHistory.findIndex(msg => msg.isLoading);
      
      if (loadingMessageIndex !== -1) {
        console.log('🔄 Reemplazando mensaje de carga con el resumen...');
        // Reemplazar el mensaje de carga con el resumen
        conversationHistory[loadingMessageIndex] = {
          role: 'assistant',
          content: currentAnswer,
          timestamp: Date.now()
        };
      } else {
        console.log('➕ Agregando nuevo mensaje de resumen...');
        // Agregar mensaje del usuario (automático)
        const userMessage = `Resume esta página: ${pageTitle}`;
        console.log('👤 Agregando mensaje del usuario:', userMessage);
        
        conversationHistory.push({
          role: 'user',
          content: userMessage,
          timestamp: Date.now()
        });

        // Agregar el resumen como respuesta del asistente
        console.log('🤖 Agregando respuesta del asistente (resumen)');
        conversationHistory.push({
          role: 'assistant',
          content: currentAnswer,
          timestamp: Date.now()
        });
      }

      console.log('📚 Historial ahora tiene', conversationHistory.length, 'mensajes');

      // Renderizar historial
      console.log('🎨 Llamando a renderChatHistory()...');
      renderChatHistory();
      
      console.log('💾 Guardando historial...');
      saveHistory();

      // Hacer scroll al final
      setTimeout(() => {
        console.log('📜 Haciendo scroll al final...');
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);

      console.log('✅ Resumen de página procesado completamente');
      return;
    }

    // MODO: Imagen (OCR, Explain, Describe)
    if (imageMode && imageUrl && prompt) {
      console.log('🖼️ Modo Imagen activado:', imageAction);
      console.log('🖼️ Image URL:', imageUrl);
      console.log('🖼️ Prompt:', prompt);

      // Cargar la imagen
      fetch(imageUrl)
        .then(res => res.blob())
        .then(async (blob) => {
          const imageFile = new File([blob], 'image.jpg', { type: blob.type });
          const imageObjectUrl = URL.createObjectURL(blob);

          console.log('✅ Imagen cargada y convertida a File');
          console.log('📦 imageFile:', imageFile);
          console.log('🎯 imageAction:', imageAction);

          // Agregar mensaje del usuario con el prompt
          conversationHistory.push({
            role: 'user',
            content: prompt,
            image: imageObjectUrl,
            imageFile: imageFile,
            imageAction: imageAction || 'describe', // Asegurar que imageAction tenga un valor
            timestamp: Date.now()
          });

          console.log('📝 Mensaje de usuario agregado al historial');
          console.log('📊 Historial actual:', conversationHistory.length, 'mensajes');

          // Renderizar historial
          renderChatHistory();
          saveHistory();

          // Hacer scroll al final
          setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }, 100);

          // Procesar automáticamente con la acción correcta
          console.log('🚀 Procesando mensaje con imagen...');
          console.log('🎯 Acción a ejecutar:', imageAction);
          
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
      console.log('📝 Modo Chat con Texto Seleccionado');

      // Si ya hay una respuesta (ej: desde el toolbar), mostrarla
      if (currentAnswer) {
        conversationHistory.push({
          role: 'user',
          content: `${action === 'summarize' ? 'Resumen' : action === 'translate' ? 'Traducción' : action === 'explain' ? 'Explicación' : 'Consulta'}: ${selectedText}`,
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
      console.log('🌐 Modo Chat con Página Web');
      
      // Activar flag de web chat mode
      isWebChatMode = true;
      
      // Mostrar indicador de página
      if (pageTitle || pageUrl) {
        updatePageIndicator({
          title: pageTitle || 'Página web',
          url: pageUrl
        });
      }
      
      // **IMPORTANTE**: Indexar el contenido de la página en el RAG Engine
      console.log('🔄 Indexando contenido de la página en RAG Engine...');
      if (typeof WebChatModule !== 'undefined') {
        try {
          console.log('📝 Estableciendo pageContent en WebChatModule...');
          // Primero establecer el contenido en el módulo
          WebChatModule.setPageContent(pageContent, {
            title: pageTitle,
            url: pageUrl
          });
          
          console.log('🔄 Llamando a initializeRAG()...');
          // Luego indexar
          await WebChatModule.initializeRAG();
          console.log('✅ Contenido indexado exitosamente en RAG Engine');
        } catch (error) {
          console.error('❌ Error indexando contenido:', error);
        }
      }
      
      // Si viene del menú contextual (context: 'page-chat'), generar resumen automático
      if (context === 'page-chat') {
        console.log('📝 Generando resumen automático de la página...');
        
        // Agregar mensaje del usuario (automático)
        const userMessage = `Resume esta página: ${pageTitle}`;
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
            console.log('🔄 Iniciando generación de resumen...');
            const summary = await WebChatModule.summarizePage();
            
            console.log('✅ Resumen generado:', summary.substring(0, 100) + '...');
            
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
                content: '❌ Error generando el resumen. Por favor, intenta preguntar algo sobre la página.',
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

  // Listener para recibir datos del diálogo
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📨 MENSAJE RECIBIDO EN SIDE PANEL');
    console.log('📨 Action:', request.action);
    console.log('📨 Has data:', !!request.data);
    if (request.data) {
      console.log('📦 Data details:', {
        context: request.data.context,
        pageTitle: request.data.pageTitle,
        imageMode: request.data.imageMode,
        imageUrl: request.data.imageUrl?.substring(0, 50),
        imageAction: request.data.imageAction,
        hasSummary: !!request.data.currentAnswer,
        hasPageContent: !!request.data.pageContent,
        pageContentLength: request.data.pageContent?.length
      });
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (request.action === 'chatData' && request.data) {
      console.log('✅ Procesando chatData...');
      // Llamar handleChatData de forma async pero responder inmediatamente
      handleChatData(request.data).then(() => {
        console.log('✅ handleChatData completado exitosamente');
      }).catch(error => {
        console.error('❌ Error procesando chatData:', error);
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
    console.log('📤 sendMessage llamado');
    const text = chatInput.value.trim();

    if (!text && !attachedImageFile && !attachedPdfFile) {
      console.log('⚠️ No hay texto, imagen ni PDF adjunto');
      return;
    }

    console.log('📝 Enviando mensaje:', { text: text.substring(0, 50), hasImage: !!attachedImageFile, hasPdf: !!attachedPdfFile });

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

    // Limpiar input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    sendBtn.disabled = true;

    // Guardar referencias antes de limpiar
    const imageFile = attachedImageFile;
    const pdfFile = attachedPdfFile;
    const action = imageAction;

    // Limpiar adjuntos
    if (attachedImageFile) {
      attachedImageFile = null;
    }
    if (attachedPdfFile) {
      attachedPdfFile = null;
    }
    chatAttachments.innerHTML = '';
    chatAttachments.style.display = 'none';

    // Procesar mensaje con IA
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
        console.log('📊 Progress:', progress);
        assistantMessage.content = `⏳ ${progress}`;
        renderChatHistory();
      };

      // Verificar si estamos en modo chat con página o PDF usando el flag
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔍 DIAGNÓSTICO DE MODO RAG:');
      console.log('📌 isWebChatMode:', isWebChatMode);
      console.log('📌 WebChatModule disponible:', typeof WebChatModule !== 'undefined');
      
      const hasPDF = typeof WebChatModule !== 'undefined' && WebChatModule.hasPDFLoaded && WebChatModule.hasPDFLoaded();
      console.log('📌 hasPDF:', hasPDF);
      
      const hasRAGContent = isWebChatMode || hasPDF;
      console.log('📌 hasRAGContent:', hasRAGContent);
      console.log('📌 pdfFile:', !!pdfFile);
      console.log('📌 imageFile:', !!imageFile);
      console.log('📌 action:', action);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Si hay PDF, procesarlo
      if (pdfFile) {
        console.log('📄 Procesando PDF:', pdfFile.name);
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
            console.log('💬 Procesando pregunta sobre el PDF:', text);
            result = await WebChatModule.chatWithPage(text, onProgress);
            assistantMessage.content = result;
          } else {
            result = `✅ PDF "${pdfFile.name}" cargado exitosamente. Ahora puedes hacer preguntas sobre su contenido.`;
            assistantMessage.content = result;
          }
          assistantMessage.isTyping = false;
        } else {
          throw new Error('WebChatModule no está disponible');
        }
      }
      // Si hay imagen, procesarla con multimodal según la acción
      else if (imageFile) {
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
      // Si estamos en modo chat con página o PDF, usar RAG
      else if (hasRAGContent && typeof WebChatModule !== 'undefined') {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🌐 USANDO RAG PARA RESPONDER (Página o PDF)');
        console.log('📝 Pregunta del usuario:', text);
        console.log('🔧 Llamando a WebChatModule.chatWithPage()...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        result = await WebChatModule.chatWithPage(text, onProgress);
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ RESPUESTA RAG RECIBIDA');
        console.log('📊 Longitud de respuesta:', result.length);
        console.log('📄 Primeros 200 chars:', result.substring(0, 200));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        assistantMessage.content = result;
        assistantMessage.isTyping = false;
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
      console.log('📄 PDF indicator updated:', pdfInfo.filename);
    } else {
      // Hide PDF indicator
      if (pdfIndicator) {
        pdfIndicator.style.display = 'none';
      }
      if (clearPdfBtn) {
        clearPdfBtn.style.display = 'none';
      }
      console.log('📄 PDF indicator hidden');
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
      console.log('📄 Page indicator updated:', pageInfo.title);
    } else {
      // Hide page indicator
      if (pageIndicator) {
        pageIndicator.style.display = 'none';
      }
      if (clearPageBtn) {
        clearPageBtn.style.display = 'none';
      }
      console.log('📄 Page indicator hidden');
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
   * Manejar selección de PDF
   */
  function handlePdfSelect(e) {
    console.log('📄 handlePdfSelect llamado');
    const file = e.target.files[0];
    if (!file) {
      console.log('⚠️ No se seleccionó ningún archivo PDF');
      return;
    }

    console.log('✅ PDF seleccionado:', file.name, file.type, file.size);
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
          <button class="pdf-attachment-btn" id="uploadPdfBtn">Subir</button>
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
      console.log('📤 Subiendo PDF al chat:', pdfFile.name);
      
      // Mostrar mensaje de progreso
      const progressMessage = addMessage('assistant', 'Procesando PDF...', true);
      
      // Subir PDF usando WebChatModule
      const result = await WebChatModule.uploadPDF(pdfFile, (progress) => {
        updateMessageContent(progressMessage, progress);
      });

      // Actualizar mensaje final
      updateMessageContent(progressMessage, `✅ PDF cargado exitosamente: ${result.filename} (${result.pages} páginas)`);
      
      // Actualizar UI para mostrar PDF cargado
      updatePdfAttachmentUI(result);
      
      // Limpiar input
      pdfInput.value = '';
      
      console.log('✅ PDF subido exitosamente:', result);
    } catch (error) {
      console.error('❌ Error subiendo PDF:', error);
      addMessage('assistant', `❌ Error procesando PDF: ${error.message}`);
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
          <div class="pdf-attachment-details">${pdfInfo.pages} páginas • Listo para chatear</div>
        </div>
        <div class="pdf-attachment-actions">
          <button class="pdf-attachment-btn" id="clearPdfBtn">Limpiar</button>
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
      addMessage('assistant', '📄 PDF eliminado. Ahora puedes chatear con la página web actual.');
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
            Transcribing...
          `;
          recordingIndicator.style.display = 'flex';

          try {
            console.log('🎤 Transcribing audio...');
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

  console.log('✅ Side Panel Chat inicializado completamente');

  // Solicitar datos pendientes del background script (después de que todo esté listo)
  console.log('📨 Preparando para solicitar datos pendientes...');
  requestPendingData();

  } catch (error) {
    console.error('❌ ERROR FATAL inicializando Side Panel:', error);
    console.error('📍 Stack trace:', error.stack);
    alert('Error inicializando chat: ' + error.message);
  }
})();

console.log('🎬 side_panel.js ejecutado completamente');

// Listener adicional para cuando el documento esté completamente listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOMContentLoaded event fired - documento listo');
  });
} else {
  console.log('📄 Documento ya está listo (readyState:', document.readyState, ')');
}

// Listener para visibilidad de la página (cuando el side panel se abre/cierra)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    console.log('👁️ Side panel ahora visible - verificando datos pendientes...');
    // Podría haber datos pendientes si el panel se cerró y reabrió
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'getChatData' }, (response) => {
        if (response && response.data) {
          console.log('📥 Datos pendientes encontrados al hacer visible el panel');
        }
      });
    }, 100);
  } else {
    console.log('👁️ Side panel ahora oculto');
  }
});

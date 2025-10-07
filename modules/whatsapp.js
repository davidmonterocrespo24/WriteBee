const WhatsAppModule = (function() {
  let whatsappButtons = new Set();
  let isWhatsApp = false;

  function init() {
    // Detectar si estamos en WhatsApp Web
    isWhatsApp = window.location.hostname.includes('web.whatsapp.com');

    if (isWhatsApp) {
      console.log('💬 WhatsApp Web detectado, iniciando módulo...');
      observeWhatsApp();
    }
  }

  function observeWhatsApp() {
    const observer = new MutationObserver(() => {
      checkForMessageArea();
      checkForAudioMessages();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Verificar inmediatamente
    setTimeout(() => {
      checkForMessageArea();
      checkForAudioMessages();
    }, 2000);
  }

  /**
   * Detectar área de composición de mensajes para agregar botón de respuesta AI
   */
  function checkForMessageArea() {
    // Buscar el footer donde está el input de mensajes
    const messageFooter = document.querySelector('footer[data-testid="conversation-compose-box-input"]') ||
                         document.querySelector('footer');

    if (!messageFooter) return;

    // Buscar la toolbar de botones (emojis, adjuntar, etc.)
    const buttonPanel = messageFooter.querySelector('[data-testid="compose-btn-send"]')?.parentElement?.parentElement;

    if (buttonPanel && !buttonPanel.querySelector('.ai-whatsapp-btn-compose')) {
      console.log('💬 WhatsApp: Insertando botón de composición AI');
      insertComposeButton(buttonPanel, messageFooter);
    }
  }

  /**
   * Detectar mensajes de audio para agregar botón de transcripción
   */
  function checkForAudioMessages() {
    // Buscar todos los mensajes de audio (botones de reproducción)
    const audioButtons = document.querySelectorAll('[aria-label*="Reproducir mensaje de voz"], [data-icon="audio-play"]');

    audioButtons.forEach(audioBtn => {
      // Buscar el contenedor del mensaje completo
      const messageContainer = audioBtn.closest('div[class*="message-"]') || 
                              audioBtn.closest('div.focusable-list-item');

      if (messageContainer && !messageContainer.querySelector('.ai-whatsapp-transcribe-btn')) {
        console.log('🎤 WhatsApp: Audio detectado, insertando botón de transcripción AI');
        insertTranscribeButton(messageContainer, audioBtn);
      }
    });
  }

  /**
   * Insertar botón de AI en el área de composición
   */
  function insertComposeButton(buttonPanel, footer) {
    const btn = document.createElement('button');
    btn.className = 'ai-whatsapp-btn-compose';
    btn.setAttribute('aria-label', 'Generar respuesta AI');
    btn.setAttribute('type', 'button');

    btn.innerHTML = `
      <div class="ai-avatar" style="width: 24px; height: 24px; font-size: 12px; background: #00a884;">
        <div class="eyes"><span></span><span></span></div>
      </div>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevenir múltiples diálogos
      if (document.querySelector('.ai-whatsapp-dialog')) {
        console.log('💬 WhatsApp: Ya hay un diálogo abierto');
        return;
      }

      console.log('💬 WhatsApp: Generando respuesta AI...');
      handleGenerateReply(footer, btn);
    });

    buttonPanel.appendChild(btn);
    whatsappButtons.add(btn);
    console.log('✅ WhatsApp: Botón de composición insertado');
  }

  /**
   * Insertar botón de transcripción junto a mensajes de audio
   */
  function insertTranscribeButton(messageContainer, audioElement) {
    const btn = document.createElement('button');
    btn.className = 'ai-whatsapp-transcribe-btn';
    btn.setAttribute('aria-label', 'Transcribir con AI');
    btn.setAttribute('type', 'button');
    btn.title = 'Transcribir audio con AI';

    // Estilos inline para asegurar visibilidad
    btn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1000;
      background: #00a884;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    `;

    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" fill="none" stroke="white" stroke-width="2"/>
        <text x="12" y="17" text-anchor="middle" font-size="5" fill="white" font-weight="bold">AI</text>
      </svg>
    `;

    // Hover effect
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#06cf9c';
      btn.style.transform = 'scale(1.1)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#00a884';
      btn.style.transform = 'scale(1)';
    });

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log('🎤 WhatsApp: Transcribiendo audio...');
      await handleTranscribeAudio(audioElement, btn, messageContainer);
    });

    // Asegurar que el contenedor tenga position relative
    messageContainer.style.position = 'relative';
    
    // Insertar el botón al inicio del contenedor para que sea visible
    messageContainer.insertBefore(btn, messageContainer.firstChild);

    console.log('✅ WhatsApp: Botón de transcripción AI insertado');
  }

  /**
   * Generar respuesta AI basada en el contexto de la conversación
   */
  async function handleGenerateReply(footer, buttonElement) {
    // Extraer mensajes recientes de la conversación
    const messages = extractConversationContext();

    if (!messages || messages.length === 0) {
      console.log('⚠️ No se pudo extraer contexto de la conversación');
    }

    // Crear diálogo para generar respuesta
    const dialog = createWhatsAppDialog('compose', messages, buttonElement);
    document.body.appendChild(dialog);
  }

  /**
   * Transcribir mensaje de audio
   */
  async function handleTranscribeAudio(audioElement, buttonElement, container) {
    try {
      // Mostrar estado de carga
      buttonElement.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" class="ai-spinner">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      `;
      buttonElement.disabled = true;

      // Intentar obtener el audio del mensaje de WhatsApp
      const audioBlob = await extractAudioFromWhatsApp(audioElement, container);

      if (audioBlob) {
        // Si se obtuvo el audio, transcribirlo directamente
        console.log('🎤 Audio extraído del mensaje, transcribiendo...');
        await transcribeAudioDirectly(audioBlob, buttonElement, container);
      } else {
        // Si no se pudo extraer, mostrar diálogo para subir/grabar
        console.log('⚠️ No se pudo extraer el audio, mostrando opciones alternativas');
        const dialog = createWhatsAppDialog('transcribe', null, buttonElement, container);
        document.body.appendChild(dialog);
        
        // Restaurar botón
        buttonElement.innerHTML = `
          <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" fill="none" stroke="white" stroke-width="2"/>
            <text x="12" y="17" text-anchor="middle" font-size="5" fill="white" font-weight="bold">AI</text>
          </svg>
        `;
        buttonElement.disabled = false;
      }

    } catch (error) {
      console.error('Error al transcribir:', error);
      alert('Error al transcribir audio: ' + error.message);
      
      // Restaurar botón
      buttonElement.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" fill="none" stroke="white" stroke-width="2"/>
          <text x="12" y="17" text-anchor="middle" font-size="5" fill="white" font-weight="bold">AI</text>
        </svg>
      `;
      buttonElement.disabled = false;
    }
  }

  /**
   * Extraer el audio directamente del mensaje de WhatsApp
   */
  async function extractAudioFromWhatsApp(audioElement, container) {
    try {
      console.log('🔍 Intentando extraer audio del mensaje de WhatsApp...');
      console.log('📦 Contenedor:', container);
      console.log('🎵 Elemento de audio:', audioElement);

      // Método 1: Buscar elemento <audio> en TODO el documento (WhatsApp puede crearlo fuera del contenedor)
      const allAudioElements = document.querySelectorAll('audio');
      console.log(`🔍 Elementos <audio> encontrados en la página: ${allAudioElements.length}`);
      
      for (const audioTag of allAudioElements) {
        if (audioTag.src && audioTag.src.startsWith('blob:')) {
          console.log('✅ Encontrado elemento audio con blob:', audioTag.src);
          try {
            const response = await fetch(audioTag.src);
            const blob = await response.blob();
            console.log('✅ Audio extraído, tamaño:', blob.size, 'bytes');
            return blob;
          } catch (e) {
            console.log('⚠️ Error al obtener blob:', e);
          }
        }
      }

      // Método 2: Simular clic en reproducir y esperar más tiempo
      const playButton = container.querySelector('[aria-label*="Reproducir"]') ||
                        container.querySelector('[data-icon="audio-play"]');
      
      if (playButton) {
        console.log('🎬 Encontrado botón de reproducir, simulando clic...');
        playButton.click();
        
        // Esperar más tiempo y buscar el audio creado
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const allAudiosAfterClick = document.querySelectorAll('audio');
        console.log(`🔍 Elementos <audio> después del clic: ${allAudiosAfterClick.length}`);
        
        for (const audioTag of allAudiosAfterClick) {
          console.log('🎵 Audio encontrado:', {
            src: audioTag.src,
            currentSrc: audioTag.currentSrc,
            paused: audioTag.paused,
            duration: audioTag.duration
          });
          
          if (audioTag.src && audioTag.src.startsWith('blob:')) {
            // Pausar el audio
            try {
              audioTag.pause();
              console.log('⏸️ Audio pausado');
            } catch (e) {
              console.log('⚠️ No se pudo pausar:', e);
            }
            
            try {
              const response = await fetch(audioTag.src);
              const blob = await response.blob();
              console.log('✅ Audio extraído después del clic, tamaño:', blob.size, 'bytes');
              return blob;
            } catch (e) {
              console.log('⚠️ Error al obtener blob después del clic:', e);
            }
          }
        }
      }

      // Método 3: Buscar en el DOM global elementos con src
      const mediaElements = document.querySelectorAll('[src*="blob:"]');
      console.log(`🔍 Elementos con blob: encontrados: ${mediaElements.length}`);
      
      for (const media of mediaElements) {
        console.log('📦 Elemento encontrado:', media.tagName, media.src);
        if (media.src && (media.tagName === 'AUDIO' || media.tagName === 'VIDEO')) {
          try {
            const response = await fetch(media.src);
            const blob = await response.blob();
            console.log('✅ Audio extraído de elemento multimedia, tamaño:', blob.size, 'bytes');
            return blob;
          } catch (e) {
            console.log('⚠️ Error al obtener blob de elemento multimedia:', e);
          }
        }
      }

      console.log('⚠️ No se pudo extraer el audio automáticamente');
      console.log('ℹ️ WhatsApp usa audio encriptado que no se puede acceder directamente');
      return null;

    } catch (error) {
      console.error('❌ Error al extraer audio:', error);
      return null;
    }
  }

  /**
   * Transcribir audio directamente sin mostrar diálogo
   */
  async function transcribeAudioDirectly(audioBlob, buttonElement, container) {
    try {
      console.log('🎤 Transcribiendo audio...', audioBlob.size, 'bytes');

      // Crear diálogo de resultados
      const dialog = createTranscriptionResultDialog(buttonElement);
      document.body.appendChild(dialog);

      const answerDiv = dialog.querySelector('.ai-answer');
      const actions = dialog.querySelector('.ai-actions');
      const loadingDiv = dialog.querySelector('.loading-message');

      // Mostrar estado de carga
      if (loadingDiv) {
        loadingDiv.style.display = 'block';
      }

      // Transcribir usando el módulo multimodal
      const result = await MultimodalModule.transcribeAudio(
        audioBlob,
        'transcribe',
        (progress) => {
          if (answerDiv) {
            answerDiv.textContent = progress;
          }
        }
      );

      // Ocultar loading
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }

      // Mostrar resultado
      if (answerDiv) {
        answerDiv.textContent = result;
        answerDiv.style.display = 'block';
      }

      if (actions) {
        actions.style.display = 'flex';
      }

      // Restaurar botón
      buttonElement.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" fill="none" stroke="white" stroke-width="2"/>
          <text x="12" y="17" text-anchor="middle" font-size="5" fill="white" font-weight="bold">AI</text>
        </svg>
      `;
      buttonElement.disabled = false;

    } catch (error) {
      console.error('Error al transcribir:', error);
      alert('Error al transcribir audio: ' + error.message);
      buttonElement.disabled = false;
    }
  }

  /**
   * Crear diálogo simple de resultados de transcripción
   */
  function createTranscriptionResultDialog(buttonElement) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-whatsapp-dialog';
    dialog.dataset.pinned = 'true';

    // Posicionar el diálogo
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const dialogWidth = 520;
      const dialogHeight = 400;

      let left = rect.right + 20;
      let top = rect.top + window.scrollY;

      if (left + dialogWidth > window.innerWidth) {
        left = rect.left - dialogWidth - 20;
      }

      if (left < 20) {
        left = (window.innerWidth - dialogWidth) / 2;
      }

      if (top < window.scrollY + 20) {
        top = window.scrollY + 20;
      }

      if (top + dialogHeight > window.scrollY + window.innerHeight - 20) {
        top = window.scrollY + window.innerHeight - dialogHeight - 20;
      }

      dialog.style.left = `${left}px`;
      dialog.style.top = `${top}px`;
      dialog.style.position = 'absolute';
    }

    dialog.style.width = 'min(520px, 92vw)';

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="WhatsApp AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">🎤 Transcripción de Audio</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body" style="padding: 1.5rem;">
        <div class="loading-message" style="text-align: center; padding: 2rem;">
          <div class="ai-spinner" style="margin: 0 auto 1rem; width: 40px; height: 40px;">
            <svg viewBox="0 0 24 24" width="40" height="40">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <p>Transcribiendo audio...</p>
        </div>
        <div class="ai-answer" style="display: none; min-height: 100px; white-space: pre-wrap;"></div>
      </div>

      <div class="ai-actions" style="display: none;">
        <div class="left">Transcripción completada</div>
        <div class="right">
          <button class="ai-iconbtn copy-btn" aria-label="Copiar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
          </button>
          <button class="ai-iconbtn insert-btn" aria-label="Insertar en chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Configurar eventos
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => dialog.remove());

    const copyBtn = dialog.querySelector('.copy-btn');
    copyBtn?.addEventListener('click', () => {
      const answerDiv = dialog.querySelector('.ai-answer');
      navigator.clipboard.writeText(answerDiv.textContent);
      copyBtn.innerHTML = `<span style="font-size: 0.9rem;">✓</span>`;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <rect x="9" y="9" width="10" height="10" rx="2"></rect>
            <rect x="5" y="5" width="10" height="10" rx="2"></rect>
          </svg>
        `;
      }, 2000);
    });

    const insertBtn = dialog.querySelector('.insert-btn');
    insertBtn?.addEventListener('click', () => {
      const answerDiv = dialog.querySelector('.ai-answer');
      insertTextIntoWhatsApp(answerDiv.textContent);
      dialog.remove();
    });

    DialogModule.enableDrag(dialog);

    return dialog;
  }

  /**
   * Extraer contexto de los últimos mensajes de la conversación
   */
  function extractConversationContext(limit = 10) {
    const messages = [];

    // Buscar el área de mensajes
    const messagesArea = document.querySelector('[data-testid="conversation-panel-messages"]') ||
                        document.querySelector('div[class*="copyable-area"]');

    if (!messagesArea) {
      console.log('⚠️ No se encontró área de mensajes');
      return messages;
    }

    // Obtener mensajes recientes
    const messageElements = messagesArea.querySelectorAll('[data-testid="msg-container"]');
    const recentMessages = Array.from(messageElements).slice(-limit);

    recentMessages.forEach(msgEl => {
      // Determinar si es mensaje enviado o recibido
      const isOutgoing = msgEl.classList.contains('message-out') ||
                        msgEl.querySelector('[data-testid="msg-meta"]')?.textContent?.includes('✓');

      // Extraer texto del mensaje
      const textElement = msgEl.querySelector('span.selectable-text') ||
                         msgEl.querySelector('[data-testid="conversation-text"]');

      if (textElement) {
        const text = textElement.textContent || textElement.innerText;
        messages.push({
          role: isOutgoing ? 'user' : 'assistant',
          content: text.trim()
        });
      }
    });

    console.log(`📝 WhatsApp: ${messages.length} mensajes extraídos`);
    return messages;
  }

  /**
   * Crear diálogo de WhatsApp
   */
  function createWhatsAppDialog(mode, context, buttonElement, audioContainer = null) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-whatsapp-dialog';
    dialog.dataset.pinned = 'true';
    dialog.dataset.mode = mode;

    // Posicionar el diálogo
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const dialogWidth = 520;
      const dialogHeight = mode === 'transcribe' ? 400 : 600;

      let left = rect.right + 20;
      let top = rect.top + window.scrollY;

      // Ajustar si se sale de la pantalla
      if (left + dialogWidth > window.innerWidth) {
        left = rect.left - dialogWidth - 20;
      }

      if (left < 20) {
        left = (window.innerWidth - dialogWidth) / 2;
      }

      if (top < window.scrollY + 20) {
        top = window.scrollY + 20;
      }

      if (top + dialogHeight > window.scrollY + window.innerHeight - 20) {
        top = window.scrollY + window.innerHeight - dialogHeight - 20;
      }

      dialog.style.left = `${left}px`;
      dialog.style.top = `${top}px`;
      dialog.style.position = 'absolute';
    } else {
      dialog.style.left = '50%';
      dialog.style.top = '50%';
      dialog.style.transform = 'translate(-50%, -50%)';
    }

    dialog.style.width = 'min(520px, 92vw)';

    if (mode === 'transcribe') {
      dialog.innerHTML = createTranscribeDialogHTML();
      setupTranscribeDialog(dialog);
    } else {
      dialog.innerHTML = createComposeDialogHTML(context);
      setupComposeDialog(dialog, context);
    }

    return dialog;
  }

  /**
   * HTML para diálogo de transcripción
   */
  function createTranscribeDialogHTML() {
    return `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="WhatsApp AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">🎤 Transcribir Audio de WhatsApp</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body" style="padding: 1.5rem;">
        <div class="ai-whatsapp-transcribe-section">
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
            <strong>ℹ️ Nota importante:</strong>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
              WhatsApp encripta los audios, así que no se pueden extraer automáticamente. 
              <strong>Descarga el audio</strong> haciendo clic derecho en el mensaje → "Descargar" y luego súbelo aquí.
            </p>
          </div>

          <div class="transcribe-options">
            <button class="transcribe-btn upload-btn" data-action="upload" style="flex: 1;">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              📥 Subir audio descargado
            </button>
            <button class="transcribe-btn record-btn" data-action="record" style="flex: 1;">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <circle cx="12" cy="12" r="8"/>
              </svg>
              🎙️ Grabar nuevo audio
            </button>
          </div>
          <input type="file" accept="audio/*,.opus" style="display: none;" class="audio-file-input" />

          <div class="audio-player-section" style="display: none; margin-top: 1rem;">
            <audio controls style="width: 100%; margin-bottom: 1rem;"></audio>
            <select class="transcribe-mode">
              <option value="transcribe">Transcribir texto completo</option>
              <option value="summary">Resumir contenido</option>
            </select>
            <button class="transcribe-btn process-btn" style="margin-top: 0.5rem; width: 100%;">
              ✨ Procesar audio
            </button>
          </div>

          <div class="transcribe-result" style="margin-top: 1rem; display: none;">
            <div class="ai-answer" style="min-height: 100px; white-space: pre-wrap;"></div>
          </div>
        </div>
      </div>

      <div class="ai-actions" style="display: none;">
        <div class="left">Transcripción completada</div>
        <div class="right">
          <button class="ai-iconbtn copy-btn" aria-label="Copiar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
          </button>
          <button class="ai-iconbtn insert-btn" aria-label="Insertar en chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * HTML para diálogo de composición de mensajes
   */
  function createComposeDialogHTML(context) {
    const contextPreview = context && context.length > 0
      ? `<div class="ai-preview"><strong>Contexto:</strong><br>${context.slice(-3).map(m => `${m.role === 'user' ? '👤' : '💬'} ${m.content}`).join('<br>')}</div>`
      : '<div class="ai-preview">Sin contexto previo</div>';

    return `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="WhatsApp AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">💬 Generar Respuesta</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        ${contextPreview}
        <div class="ai-whatsapp-input-section" style="margin: 1rem 0;">
          <textarea
            class="ai-whatsapp-prompt"
            placeholder="Describe el tipo de respuesta que quieres generar..."
            rows="3"
            style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; resize: vertical;"
          ></textarea>
          <button class="ai-btn generate-reply-btn" style="margin-top: 0.5rem; width: 100%;">
            Generar respuesta
          </button>
        </div>
        <div class="ai-answer" style="display: none;"></div>
      </div>

      <div class="ai-actions" style="display: none;">
        <div class="left">Respuesta generada</div>
        <div class="right">
          <button class="ai-iconbtn copy-btn" aria-label="Copiar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
          </button>
          <button class="ai-iconbtn insert-btn" aria-label="Insertar en chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button class="ai-iconbtn regenerate-btn" aria-label="Regenerar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Configurar eventos del diálogo de transcripción
   */
  function setupTranscribeDialog(dialog) {
    const recordBtn = dialog.querySelector('.record-btn');
    const uploadBtn = dialog.querySelector('.upload-btn');
    const fileInput = dialog.querySelector('.audio-file-input');
    const audioPlayer = dialog.querySelector('audio');
    const playerSection = dialog.querySelector('.audio-player-section');
    const processBtn = dialog.querySelector('.process-btn');
    const transcribeMode = dialog.querySelector('.transcribe-mode');
    const resultSection = dialog.querySelector('.transcribe-result');
    const answerDiv = dialog.querySelector('.ai-answer');
    const actions = dialog.querySelector('.ai-actions');

    let currentAudioBlob = null;
    let mediaRecorder = null;
    let recordedChunks = [];

    // Grabar audio
    recordBtn.addEventListener('click', async () => {
      if (recordBtn.classList.contains('recording')) {
        // Detener grabación
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      } else {
        // Iniciar grabación
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          recordedChunks = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            currentAudioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
            audioPlayer.src = URL.createObjectURL(currentAudioBlob);
            playerSection.style.display = 'block';
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <circle cx="12" cy="12" r="8"/>
              </svg>
              Grabar audio
            `;
            stream.getTracks().forEach(t => t.stop());
          };

          mediaRecorder.start(100);
          recordBtn.classList.add('recording');
          recordBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" fill="red">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            Detener
          `;
        } catch (error) {
          console.error('Error al acceder al micrófono:', error);
          alert('No se pudo acceder al micrófono: ' + error.message);
        }
      }
    });

    // Subir archivo
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        currentAudioBlob = file;
        audioPlayer.src = URL.createObjectURL(file);
        playerSection.style.display = 'block';
      }
    });

    // Procesar audio
    processBtn.addEventListener('click', async () => {
      if (!currentAudioBlob) {
        alert('Por favor, graba o sube un audio primero');
        return;
      }

      try {
        processBtn.disabled = true;
        processBtn.textContent = 'Procesando...';
        answerDiv.textContent = '';
        resultSection.style.display = 'block';

        const mode = transcribeMode.value;
        const result = await MultimodalModule.transcribeAudio(
          currentAudioBlob,
          mode,
          (progress) => {
            answerDiv.textContent = progress;
          }
        );

        answerDiv.textContent = result;
        actions.style.display = 'flex';
        processBtn.disabled = false;
        processBtn.textContent = 'Procesar audio';

      } catch (error) {
        console.error('Error al procesar audio:', error);
        answerDiv.textContent = `❌ Error: ${error.message}`;
        processBtn.disabled = false;
        processBtn.textContent = 'Procesar audio';
      }
    });

    // Botón copiar
    const copyBtn = dialog.querySelector('.copy-btn');
    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(answerDiv.textContent);
      copyBtn.innerHTML = `<span style="font-size: 0.9rem;">✓</span>`;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <rect x="9" y="9" width="10" height="10" rx="2"></rect>
            <rect x="5" y="5" width="10" height="10" rx="2"></rect>
          </svg>
        `;
      }, 2000);
    });

    // Botón insertar en chat
    const insertBtn = dialog.querySelector('.insert-btn');
    insertBtn?.addEventListener('click', () => {
      insertTextIntoWhatsApp(answerDiv.textContent);
      dialog.remove();
    });

    // Cerrar diálogo
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      dialog.remove();
    });

    // Drag and drop
    DialogModule.enableDrag(dialog);
  }

  /**
   * Configurar eventos del diálogo de composición
   */
  function setupComposeDialog(dialog, context) {
    const generateBtn = dialog.querySelector('.generate-reply-btn');
    const promptInput = dialog.querySelector('.ai-whatsapp-prompt');
    const answerDiv = dialog.querySelector('.ai-answer');
    const actions = dialog.querySelector('.ai-actions');
    const inputSection = dialog.querySelector('.ai-whatsapp-input-section');

    generateBtn.addEventListener('click', async () => {
      const userPrompt = promptInput.value.trim();

      if (!userPrompt && (!context || context.length === 0)) {
        alert('Por favor, escribe una instrucción o asegúrate de tener contexto de la conversación');
        return;
      }

      try {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generando...';
        answerDiv.textContent = '';
        answerDiv.style.display = 'block';

        // Construir prompt con contexto
        let fullPrompt = '';
        if (context && context.length > 0) {
          fullPrompt += 'Contexto de la conversación:\n';
          context.forEach(msg => {
            fullPrompt += `${msg.role === 'user' ? 'Yo' : 'Otro'}: ${msg.content}\n`;
          });
          fullPrompt += '\n';
        }
        fullPrompt += userPrompt || 'Genera una respuesta apropiada basada en el contexto.';

        const result = await AIModule.aiAnswer(fullPrompt, (progress) => {
          answerDiv.textContent = progress;
        });

        answerDiv.textContent = result;
        actions.style.display = 'flex';
        inputSection.style.display = 'none';
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generar respuesta';

      } catch (error) {
        console.error('Error al generar respuesta:', error);
        answerDiv.textContent = `❌ Error: ${error.message}`;
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generar respuesta';
      }
    });

    // Botones de acciones
    const copyBtn = dialog.querySelector('.copy-btn');
    copyBtn?.addEventListener('click', () => {
      navigator.clipboard.writeText(answerDiv.textContent);
      copyBtn.innerHTML = `<span style="font-size: 0.9rem;">✓</span>`;
      setTimeout(() => {
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <rect x="9" y="9" width="10" height="10" rx="2"></rect>
            <rect x="5" y="5" width="10" height="10" rx="2"></rect>
          </svg>
        `;
      }, 2000);
    });

    const insertBtn = dialog.querySelector('.insert-btn');
    insertBtn?.addEventListener('click', () => {
      insertTextIntoWhatsApp(answerDiv.textContent);
      dialog.remove();
    });

    const regenerateBtn = dialog.querySelector('.regenerate-btn');
    regenerateBtn?.addEventListener('click', () => {
      inputSection.style.display = 'block';
      actions.style.display = 'none';
      answerDiv.style.display = 'none';
    });

    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });

    // Drag and drop
    DialogModule.enableDrag(dialog);
  }

  /**
   * Insertar texto en el campo de mensaje de WhatsApp
   */
  function insertTextIntoWhatsApp(text) {
    // Buscar el div editable de WhatsApp
    const messageInput = document.querySelector('[contenteditable="true"][data-testid="conversation-compose-box-input"]') ||
                        document.querySelector('div[contenteditable="true"][role="textbox"]');

    if (messageInput) {
      // Insertar texto
      messageInput.focus();

      // Usar el método nativo de WhatsApp si está disponible
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });

      messageInput.dispatchEvent(pasteEvent);

      // Fallback: insertar directamente
      if (!messageInput.textContent.includes(text)) {
        messageInput.textContent = text;

        // Disparar evento input para que WhatsApp detecte el cambio
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true
        });
        messageInput.dispatchEvent(inputEvent);
      }

      console.log('✅ Texto insertado en WhatsApp');
    } else {
      console.log('⚠️ No se encontró el campo de mensaje');
      navigator.clipboard.writeText(text);
      alert('Texto copiado al portapapeles. Pégalo en el chat de WhatsApp.');
    }
  }

  return {
    init
  };
})();

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', WhatsAppModule.init);
} else {
  WhatsAppModule.init();
}

// Exponer globalmente
window.WhatsAppModule = WhatsAppModule;

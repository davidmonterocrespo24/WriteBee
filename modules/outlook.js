const OutlookModule = (function() {
  let outlookButton = null;
  let isOutlook = false;

  console.log('🔧 Módulo OutlookModule cargándose...');

  function init() {
    // Detectar si estamos en Outlook
    isOutlook = window.location.hostname.includes('outlook.live.com') || 
                window.location.hostname.includes('outlook.office.com') ||
                window.location.hostname.includes('outlook.office365.com');
    
    if (isOutlook) {
      console.log('📧 Outlook detectado, iniciando módulo...');
      observeOutlook();
    } else {
      console.log('ℹ️ No estamos en Outlook, módulo en espera');
    }
  }

  function observeOutlook() {
    // Observar cambios en el DOM para detectar cuando se abre un correo
    const observer = new MutationObserver(() => {
      checkForEmailView();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Verificar inmediatamente
    setTimeout(checkForEmailView, 1000);
  }

  function checkForEmailView() {
    // Buscar específicamente el editor de composición/respuesta de Outlook
    // Solo mostrar el botón cuando se está redactando un correo
    const composeEditor = document.querySelector('[role="textbox"][aria-label*="Cuerpo"]') ||
                          document.querySelector('[role="textbox"][contenteditable="true"]') ||
                          document.querySelector('.elementToProof[contenteditable="true"]') ||
                          document.querySelector('div[contenteditable="true"][aria-label]');
    
    if (composeEditor && !outlookButton) {
      console.log('✍️ Editor de composición detectado en Outlook');
      insertAIButton(composeEditor);
    } else if (!composeEditor && outlookButton) {
      // Si ya no está el editor activo, remover el botón
      removeAIButton();
    }
  }

  function insertAIButton(composeEditor) {
    // Buscar el área donde está el editor de composición
    const editorContainer = composeEditor.closest('[role="main"]') || 
                           composeEditor.closest('.customScrollBar') ||
                           composeEditor.parentElement;
    
    if (!editorContainer) {
      console.log('⚠️ No se encontró contenedor del editor');
      return;
    }

    // Buscar la barra de herramientas del editor (botones de formato, adjuntar, etc.)
    const toolbar = editorContainer.querySelector('[role="toolbar"]') ||
                    editorContainer.querySelector('[data-app-section="ComposeToolbar"]') ||
                    editorContainer.querySelector('.ms-FocusZone');
    
    if (toolbar) {
      // Crear botón de AI para la toolbar
      outlookButton = document.createElement('button');
      outlookButton.className = 'ai-outlook-button';
      outlookButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M8 10h8M8 14h4"/>
        </svg>
        <span>AI Asistente</span>
      `;

      outlookButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAIAssistant(composeEditor);
      });

      toolbar.appendChild(outlookButton);
      console.log('✅ Botón AI insertado en toolbar de composición');
    } else {
      // Si no hay toolbar, crear botón flotante cerca del editor
      createFloatingButton(editorContainer, composeEditor);
    }
  }

  function createFloatingButton(editorContainer, composeEditor) {
    // Crear un botón flotante cerca del editor de composición
    outlookButton = document.createElement('div');
    outlookButton.className = 'ai-outlook-floating-button';
    outlookButton.innerHTML = `
      <button class="ai-outlook-button-float">
        <div class="ai-avatar" style="width: 20px; height: 20px; font-size: 10px;">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <span>AI Asistente</span>
      </button>
    `;

    outlookButton.querySelector('button').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleAIAssistant(composeEditor);
    });

    // Insertar antes del editor
    editorContainer.insertBefore(outlookButton, composeEditor);
    console.log('✅ Botón flotante AI insertado cerca del editor');
  }

  function removeAIButton() {
    if (outlookButton) {
      outlookButton.remove();
      outlookButton = null;
    }
  }

  async function handleAIAssistant(composeEditor) {
    console.log('🤖 Asistente AI activado para Outlook...');

    // Intentar extraer el contexto del correo original (si se está respondiendo)
    let originalEmailContent = null;
    
    // Buscar el contenido del correo original en la ventana de respuesta
    const originalMessage = document.querySelector('[aria-label*="Mensaje original"]') ||
                           document.querySelector('.rps_b91e') ||
                           document.querySelector('[data-app-section="ReadingPaneBody"]');
    
    if (originalMessage) {
      originalEmailContent = originalMessage.innerText || originalMessage.textContent;
      console.log('📧 Contexto del correo original encontrado');
    }

    // Crear el diálogo de asistente
    const dialog = createOutlookDialog(composeEditor, originalEmailContent);
    document.body.appendChild(dialog);

    // Si hay un correo original, generar resumen automáticamente
    if (originalEmailContent) {
      const summaryDiv = dialog.querySelector('.ai-outlook-summary-content');
      summaryDiv.innerHTML = '<div style="color: #a5a7b1; text-align: center; padding: 20px;">Analizando contexto...</div>';

      try {
        const summary = await AIModule.aiSummarize(originalEmailContent, (percent) => {
          summaryDiv.innerHTML = `<div style="color: #a5a7b1; text-align: center; padding: 20px;">Analizando contexto ${percent}%</div>`;
        });

        MarkdownRenderer.renderToElement(summaryDiv, summary);
      } catch (error) {
        summaryDiv.innerHTML = `<div style="color: #ff6b6b; padding: 12px;">Error: ${error.message}</div>`;
      }
    }
  }

  function extractEmailContent(emailContainer) {
    // Intentar extraer el texto del correo en Outlook
    const contentDiv = emailContainer.querySelector('[role="document"]') || 
                       emailContainer.querySelector('.elementToProof') ||
                       emailContainer.querySelector('[data-app-section="ReadingPaneBody"]') ||
                       emailContainer.querySelector('.rps_b91e') ||
                       emailContainer.querySelector('[aria-label*="Cuerpo"]');
    
    if (contentDiv) {
      return contentDiv.innerText || contentDiv.textContent;
    }

    // Si no se encuentra un selector específico, intentar con todo el contenedor
    return emailContainer.innerText || emailContainer.textContent;
  }

  function createOutlookDialog(composeEditor, originalEmailContent) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel';
    dialog.dataset.pinned = 'true';

    // Centrar en la pantalla
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.width = 'min(680px, 92vw)';

    const hasContext = originalEmailContent && originalEmailContent.trim().length > 0;

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="Outlook AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">Asistente de Outlook</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        ${hasContext ? `
        <div class="ai-outlook-section">
          <div class="ai-outlook-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Contexto del mensaje</span>
          </div>
          <div class="ai-outlook-summary-content"></div>
        </div>
        ` : ''}

        <div class="ai-outlook-section">
          <div class="ai-outlook-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Redactar con AI</span>
          </div>
          <div class="ai-followup" style="margin-bottom: 12px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <input type="text" class="ai-outlook-input" placeholder="${hasContext ? '¿Qué quieres incluir en tu respuesta?' : '¿Qué quieres escribir?'}" />
            <button class="ai-send-btn ai-outlook-generate-btn" aria-label="Generar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13"/>
                <path d="M22 2L15 22L11 13L2 9L22 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="ai-outlook-response" style="display: none;">
          <div class="ai-outlook-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Texto generado</span>
          </div>
          <div class="ai-outlook-response-content" contenteditable="true"></div>
          <div class="ai-outlook-response-actions">
            <button class="ai-outlook-insert-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Insertar en Outlook
            </button>
            <button class="ai-outlook-copy-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              Copiar
            </button>
            <button class="ai-outlook-regenerate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Regenerar
            </button>
          </div>
        </div>
      </div>
    `;

    // Hacer el diálogo arrastrable
    makeDraggable(dialog);

    // Eventos del diálogo
    setupOutlookDialogEvents(dialog, composeEditor, originalEmailContent);

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

  function setupOutlookDialogEvents(dialog, composeEditor, originalEmailContent) {
    // Botón cerrar
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });

    // Botón generar respuesta
    const generateBtn = dialog.querySelector('.ai-outlook-generate-btn');
    const userInput = dialog.querySelector('.ai-outlook-input');
    const responseSection = dialog.querySelector('.ai-outlook-response');
    const responseContent = dialog.querySelector('.ai-outlook-response-content');

    const generateResponse = async () => {
      const userContent = userInput.value.trim();

      if (!userContent) {
        userInput.focus();
        return;
      }

      generateBtn.disabled = true;
      const originalHTML = generateBtn.innerHTML;
      generateBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" opacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;

      try {
        const response = await generateEmailText(originalEmailContent, userContent);

        // Renderizar con markdown
        MarkdownRenderer.renderToElement(responseContent, response);
        responseSection.style.display = 'block';

        // Limpiar input
        userInput.value = '';
      } catch (error) {
        alert('Error al generar el texto: ' + error.message);
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalHTML;
      }
    };

    generateBtn.addEventListener('click', generateResponse);

    // Permitir Enter para generar
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateResponse();
      }
    });

    // Botón copiar
    const copyBtn = dialog.querySelector('.ai-outlook-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const text = responseContent.innerText;
        navigator.clipboard.writeText(text).then(() => {
          const originalHTML = copyBtn.innerHTML;
          copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Copiado
          `;
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
        });
      });
    }

    // Botón regenerar
    const regenerateBtn = dialog.querySelector('.ai-outlook-regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        const userContent = userInput.value.trim() || 'Genera un texto profesional';

        regenerateBtn.disabled = true;
        const originalHTML = regenerateBtn.innerHTML;
        regenerateBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" opacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </path>
          </svg>
        `;

        try {
          const response = await generateEmailText(originalEmailContent, userContent);
          MarkdownRenderer.renderToElement(responseContent, response);
        } catch (error) {
          alert('Error al regenerar: ' + error.message);
        } finally {
          regenerateBtn.disabled = false;
          regenerateBtn.innerHTML = originalHTML;
        }
      });
    }

    // Botón insertar en Outlook
    const insertBtn = dialog.querySelector('.ai-outlook-insert-btn');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        const text = responseContent.innerText;
        insertTextIntoOutlookEditor(composeEditor, text);
        dialog.remove();
      });
    }
  }

  async function generateEmailText(originalEmailContent, userContent) {
    let prompt;
    
    if (originalEmailContent && originalEmailContent.trim().length > 0) {
      // Si hay contexto de un correo original, generar una respuesta
      prompt = `Correo original:
${originalEmailContent}

Instrucciones para la respuesta:
${userContent}

Genera una respuesta profesional y cordial para este correo electrónico, siguiendo las instrucciones del usuario. La respuesta debe ser clara, bien estructurada y apropiada para un correo electrónico profesional.`;
    } else {
      // Si no hay contexto, generar texto desde cero
      prompt = `Redacta un correo electrónico profesional con el siguiente contenido:

${userContent}

El correo debe ser claro, cordial y apropiado para un contexto profesional.`;
    }

    const response = await AIModule.aiAnswer(prompt);
    return response;
  }

  function insertTextIntoOutlookEditor(composeEditor, text) {
    if (!composeEditor) {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(text).then(() => {
        alert('Texto copiado al portapapeles. Pégalo en el editor (Ctrl+V).');
      });
      return;
    }

    // Insertar el texto en el editor
    composeEditor.focus();
    
    // Método 1: Intentar con execCommand
    const success = document.execCommand('insertText', false, text);
    
    // Método 2: Si no funciona, insertar directamente en el HTML
    if (!success || !composeEditor.innerText.includes(text.substring(0, 20))) {
      const p = document.createElement('p');
      p.textContent = text;
      composeEditor.appendChild(p);
    }
    
    // Disparar eventos para que Outlook detecte el cambio
    composeEditor.dispatchEvent(new Event('input', { bubbles: true }));
    composeEditor.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('✅ Texto insertado en el editor de Outlook');
  }

  async function handleUnreadSummary() {
    console.log('📬 Obteniendo correos no leídos de Outlook...');
    
    try {
      const unreadEmails = await getUnreadEmails();
      
      if (unreadEmails.length === 0) {
        alert('No hay correos no leídos 🎉');
        return;
      }
      
      console.log(`📧 ${unreadEmails.length} correos no leídos encontrados en Outlook`);
      
      // Crear diálogo de resumen
      const dialog = createUnreadSummaryDialog(unreadEmails);
      document.body.appendChild(dialog);
      
      // Generar resumen
      await generateUnreadSummary(dialog, unreadEmails);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al obtener correos no leídos: ' + error.message);
    }
  }

  async function getUnreadEmails() {
    // Buscar todos los correos no leídos en Outlook
    // Outlook usa diferentes selectores según la versión
    const unreadRows = document.querySelectorAll(
      '[aria-label*="No leído"], [aria-label*="Unread"], ' +
      '.ms-List-cell[aria-label*="No leído"], ' +
      '[role="row"][aria-label*="No leído"], ' +
      '[data-is-focusable="true"][aria-label*="No leído"], ' +
      '.allowTextSelection[aria-label*="No leído"]'
    );
    
    const unreadEmails = [];
    
    for (const row of unreadRows) {
      try {
        const ariaLabel = row.getAttribute('aria-label') || '';
        
        // Extraer información del aria-label que contiene toda la info del correo
        // Formato típico: "No leído, [Remitente], [Asunto], [Fecha], [Extracto]"
        const parts = ariaLabel.split(',').map(p => p.trim());
        
        let sender = 'Desconocido';
        let subject = 'Sin asunto';
        let snippet = '';
        
        // Intentar extraer información del aria-label
        if (parts.length > 1) {
          sender = parts[1] || 'Desconocido';
          subject = parts[2] || 'Sin asunto';
          snippet = parts.slice(3).join(', ') || '';
        } else {
          // Intentar extraer de elementos internos
          const senderElement = row.querySelector('[title]') || 
                                row.querySelector('.customScrollBar span');
          const subjectElement = row.querySelector('[id*="ConversationSubject"]') ||
                                row.querySelector('[class*="subject"]');
          const snippetElement = row.querySelector('[id*="ConversationPreview"]') ||
                                row.querySelector('[class*="preview"]');
          
          sender = senderElement?.textContent?.trim() || 
                  senderElement?.getAttribute('title') || 
                  'Desconocido';
          subject = subjectElement?.textContent?.trim() || 'Sin asunto';
          snippet = snippetElement?.textContent?.trim() || '';
        }
        
        // Limpiar texto
        sender = sender.replace(/^(No leído|Unread)[,\s]*/i, '').trim();
        
        unreadEmails.push({
          sender,
          subject,
          snippet,
          row
        });
        
        // Limitar a 20 correos para no sobrecargar
        if (unreadEmails.length >= 20) break;
        
      } catch (error) {
        console.error('Error procesando correo de Outlook:', error);
      }
    }
    
    return unreadEmails;
  }

  function createUnreadSummaryDialog(unreadEmails) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel';
    dialog.dataset.pinned = 'true';
    
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.width = 'min(800px, 95vw)';
    dialog.style.maxHeight = '90vh';
    
    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="Resumen de No Leídos">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">Resumen de ${unreadEmails.length} Correos No Leídos - Outlook</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>
      
      <div class="ai-result-body" style="max-height: calc(90vh - 60px); overflow-y: auto;">
        <div class="ai-outlook-section">
          <div class="ai-outlook-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Resumen General</span>
          </div>
          <div class="ai-unread-summary-content">
            <div style="color: #a5a7b1; text-align: center; padding: 40px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.5;">
                <circle cx="12" cy="12" r="10" opacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </path>
              </svg>
              <div>Analizando correos no leídos...</div>
            </div>
          </div>
        </div>
        
        <div class="ai-outlook-section">
          <div class="ai-outlook-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>Listado de Correos (${unreadEmails.length})</span>
          </div>
          <div class="ai-unread-list">
            ${unreadEmails.map((email, index) => `
              <div class="ai-unread-item" data-index="${index}">
                <div class="ai-unread-item-header">
                  <div class="ai-unread-sender">${escapeHtml(email.sender)}</div>
                  <div class="ai-unread-number">#${index + 1}</div>
                </div>
                <div class="ai-unread-subject">${escapeHtml(email.subject)}</div>
                ${email.snippet ? `<div class="ai-unread-snippet">${escapeHtml(email.snippet.substring(0, 150))}${email.snippet.length > 150 ? '...' : ''}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Hacer el diálogo arrastrable
    makeDraggable(dialog);

    // Botón cerrar
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });

    return dialog;
  }

  async function generateUnreadSummary(dialog, unreadEmails) {
    const summaryContent = dialog.querySelector('.ai-unread-summary-content');
    
    try {
      // Crear el texto con todos los correos para el resumen
      let emailsText = `Tengo ${unreadEmails.length} correos no leídos en Outlook:\n\n`;
      
      unreadEmails.forEach((email, index) => {
        emailsText += `${index + 1}. De: ${email.sender}\n`;
        emailsText += `   Asunto: ${email.subject}\n`;
        if (email.snippet) {
          emailsText += `   Extracto: ${email.snippet.substring(0, 200)}\n`;
        }
        emailsText += `\n`;
      });

      const prompt = `${emailsText}

Por favor, genera un resumen ejecutivo de estos correos no leídos. Organiza el resumen por:
1. Prioridad (urgentes, importantes, informativos)
2. Categorías temáticas
3. Acciones requeridas

Sé conciso pero informativo.`;

      // Generar resumen con progreso
      summaryContent.innerHTML = `
        <div style="color: #a5a7b1; text-align: center; padding: 40px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.5;">
            <circle cx="12" cy="12" r="10" opacity="0.3"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
            </path>
          </svg>
        </div>
      `;

      const summary = await AIModule.aiAnswer(prompt);

      // Renderizar el resumen con markdown
      summaryContent.innerHTML = '';
      if (typeof MarkdownRenderer !== 'undefined' && MarkdownRenderer.renderToElement) {
        MarkdownRenderer.renderToElement(summaryContent, summary);
      } else {
        // Fallback si no está disponible el renderizador
        summaryContent.innerHTML = `<div style="padding: 16px; white-space: pre-wrap;">${escapeHtml(summary)}</div>`;
      }

    } catch (error) {
      console.error('Error generando resumen:', error);
      summaryContent.innerHTML = `
        <div style="color: #ff6b6b; padding: 20px; text-align: center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>Error al generar el resumen: ${escapeHtml(error.message)}</div>
        </div>
      `;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API pública
  const publicAPI = {
    init,
    handleUnreadSummary
  };

  // Hacer disponible globalmente
  window.OutlookModule = publicAPI;
  
  console.log('✅ OutlookModule cargado y exportado globalmente', publicAPI);

  return publicAPI;
})();

const GmailModule = (function() {
  let gmailButton = null;
  let isGmail = false;

  function init() {
    // Detectar si estamos en Gmail
    isGmail = window.location.hostname.includes('mail.google.com');
    
    if (isGmail) {
      console.log('📧 Gmail detectado, iniciando módulo...');
      observeGmail();
    }
  }

  function observeGmail() {
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

  async function handleUnreadSummary() {
    console.log('📬 Obteniendo correos no leídos...');
    
    try {
      const unreadEmails = await getUnreadEmails();
      
      if (unreadEmails.length === 0) {
        alert('No hay correos no leídos 🎉');
        return;
      }
      
      console.log(`📧 ${unreadEmails.length} correos no leídos encontrados`);
      
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
    // Buscar todos los correos no leídos en la vista actual
    const unreadRows = document.querySelectorAll('tr.zE, tr.zA');
    const unreadEmails = [];
    
    for (const row of unreadRows) {
      try {
        // Verificar si el correo está marcado como no leído (tiene la clase específica)
        const isUnread = row.classList.contains('zE') || 
                        row.querySelector('.zF') || // Badge de no leído
                        row.querySelector('span[email]')?.closest('tr')?.classList.contains('zE');
        
        if (!isUnread && !row.classList.contains('zE')) continue;
        
        // Extraer información del correo
        const senderElement = row.querySelector('span[email]') || 
                             row.querySelector('.yW span') ||
                             row.querySelector('.yP');
        
        const subjectElement = row.querySelector('.bog span') || 
                              row.querySelector('[data-thread-id] span');
        
        const snippetElement = row.querySelector('.y2');
        
        const sender = senderElement?.getAttribute('email') || 
                      senderElement?.textContent?.trim() || 
                      'Desconocido';
        
        const subject = subjectElement?.textContent?.trim() || 'Sin asunto';
        const snippet = snippetElement?.textContent?.trim() || '';
        
        unreadEmails.push({
          sender,
          subject,
          snippet,
          row
        });
        
        // Limitar a 20 correos para no sobrecargar
        if (unreadEmails.length >= 20) break;
        
      } catch (error) {
        console.error('Error procesando correo:', error);
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
        <div class="title">Resumen de ${unreadEmails.length} Correos No Leídos</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>
      
      <div class="ai-result-body" style="max-height: calc(90vh - 60px); overflow-y: auto;">
        <div class="ai-gmail-section">
          <div class="ai-gmail-section-header">
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
        
        <div class="ai-gmail-section">
          <div class="ai-gmail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>Lista de Correos</span>
          </div>
          <div class="ai-unread-emails-list" style="max-height: 400px; overflow-y: auto;">
            ${unreadEmails.map((email, index) => `
              <div class="ai-email-item" style="padding: 12px; border-bottom: 1px solid #2a2d3a; cursor: pointer; transition: background 0.2s;" data-index="${index}">
                <div style="display: flex; align-items: start; gap: 12px;">
                  <div style="flex: 1; min-width: 0;">
                    <div style="font-weight: 600; color: #e4e6eb; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${escapeHtml(email.sender)}
                    </div>
                    <div style="font-size: 13px; color: #b8bcc8; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${escapeHtml(email.subject)}
                    </div>
                    ${email.snippet ? `
                      <div style="font-size: 12px; color: #8b8f9b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${escapeHtml(email.snippet)}
                      </div>
                    ` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
    
    makeDraggable(dialog);
    
    // Eventos
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => dialog.remove());
    
    // Click en cada email para abrirlo
    const emailItems = dialog.querySelectorAll('.ai-email-item');
    emailItems.forEach((item, index) => {
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(255, 255, 255, 0.05)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = '';
      });
      item.addEventListener('click', () => {
        const email = unreadEmails[index];
        if (email.row) {
          email.row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          email.row.click();
        }
      });
    });
    
    return dialog;
  }

  async function generateUnreadSummary(dialog, unreadEmails) {
    const summaryContent = dialog.querySelector('.ai-unread-summary-content');
    
    try {
      // Preparar el texto de todos los correos
      const emailsText = unreadEmails.map((email, index) => {
        return `Correo ${index + 1}:
Remitente: ${email.sender}
Asunto: ${email.subject}
${email.snippet ? `Contenido: ${email.snippet}` : ''}
---`;
      }).join('\n\n');
      
      const prompt = `Analiza los siguientes ${unreadEmails.length} correos no leídos y genera un resumen ejecutivo que incluya:

1. **Resumen general**: Una vista general de los temas principales
2. **Correos urgentes o importantes**: Identifica cuáles requieren atención inmediata
3. **Categorías**: Agrupa los correos por tema o tipo (trabajo, personal, notificaciones, etc.)
4. **Acciones sugeridas**: Qué correos deberían responderse primero

Correos no leídos:

${emailsText}

Genera un resumen claro, conciso y bien estructurado en español.`;

      // Generar resumen con progreso
      const summary = await AIModule.aiAnswer(prompt, (percent) => {
        summaryContent.innerHTML = `
          <div style="color: #a5a7b1; text-align: center; padding: 40px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto; opacity: 0.5;">
              <circle cx="12" cy="12" r="10" opacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
        `;
      });
      
      // Renderizar el resumen
      MarkdownRenderer.renderToElement(summaryContent, summary);
      
    } catch (error) {
      summaryContent.innerHTML = `
        <div style="color: #ff6b6b; padding: 20px; text-align: center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>Error al generar resumen: ${error.message}</div>
        </div>
      `;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function checkForEmailView() {
    // Buscar el contenedor de un correo abierto en Gmail
    const emailBody = document.querySelector('[data-message-id]');
    
    if (emailBody && !gmailButton) {
      console.log('📬 Correo abierto detectado');
      insertAIButton(emailBody);
    } else if (!emailBody && gmailButton) {
      // Si ya no hay correo abierto, remover el botón
      removeAIButton();
    }
  }

  function insertAIButton(emailContainer) {
    // Buscar la barra de herramientas de Gmail (donde están los botones de responder, reenviar, etc.)
    const toolbar = emailContainer.querySelector('[role="toolbar"]') || 
                    emailContainer.querySelector('.gU') ||
                    emailContainer.parentElement.querySelector('[role="toolbar"]');
    
    if (!toolbar) {
      console.log('⚠️ No se encontró toolbar de Gmail');
      return;
    }

    // Crear botón de AI
    gmailButton = document.createElement('button');
    gmailButton.className = 'ai-gmail-button';
    gmailButton.innerHTML = `
      <div class="ai-avatar" style="width: 20px; height: 20px; font-size: 10px;">
        <div class="eyes"><span></span><span></span></div>
      </div>
      <span>Respuesta AI</span>
    `;

    gmailButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleAIResponse(emailContainer);
    });

    // Insertar el botón en la toolbar
    toolbar.appendChild(gmailButton);
    console.log('✅ Botón AI insertado en Gmail');
  }

  function removeAIButton() {
    if (gmailButton) {
      gmailButton.remove();
      gmailButton = null;
    }
  }

  async function handleAIResponse(emailContainer) {
    console.log('🤖 Generando respuesta AI...');

    // Extraer el contenido del correo inmediatamente
    const emailContent = extractEmailContent(emailContainer);

    if (!emailContent) {
      alert('No se pudo extraer el contenido del correo');
      return;
    }

    console.log('📧 Contenido extraído:', emailContent.substring(0, 100) + '...');

    // Crear el diálogo inmediatamente con estado de carga
    const dialog = createGmailDialog(emailContent, null);
    document.body.appendChild(dialog);

    // Mostrar estado de carga en el resumen
    const summaryDiv = dialog.querySelector('.ai-gmail-summary-content');
    summaryDiv.innerHTML = '<div style="color: #a5a7b1; text-align: center; padding: 20px;">Analizando correo...</div>';

    try {
      // Generar resumen del correo
      const summary = await AIModule.aiSummarize(emailContent, (percent) => {
        summaryDiv.innerHTML = `
          <div style="color: #a5a7b1; text-align: center; padding: 20px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto; opacity: 0.5;">
              <circle cx="12" cy="12" r="10" opacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
              </path>
            </svg>
          </div>
        `;
      });

      // Renderizar el resumen
      MarkdownRenderer.renderToElement(summaryDiv, summary);

    } catch (error) {
      summaryDiv.innerHTML = `<div style="color: #ff6b6b; padding: 12px;">Error: ${error.message}</div>`;
    }
  }

  function extractEmailContent(emailContainer) {
    // Intentar extraer el texto del correo
    const contentDiv = emailContainer.querySelector('[data-message-id] .a3s') || 
                       emailContainer.querySelector('.ii.gt') ||
                       emailContainer.querySelector('[dir="ltr"]');
    
    if (contentDiv) {
      return contentDiv.innerText || contentDiv.textContent;
    }

    return null;
  }

  function createGmailDialog(emailContent, summary) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel';
    dialog.dataset.pinned = 'true';

    // Centrar en la pantalla
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.width = 'min(680px, 92vw)';

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="Gmail AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">Asistente de Gmail</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        <div class="ai-gmail-section">
          <div class="ai-gmail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Resumen del correo</span>
          </div>
          <div class="ai-gmail-summary-content"></div>
        </div>

        <div class="ai-gmail-section">
          <div class="ai-gmail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Componer respuesta</span>
          </div>
          <div class="ai-followup" style="margin-bottom: 12px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <input type="text" class="ai-gmail-input" placeholder="¿Qué quieres incluir en tu respuesta?" />
            <button class="ai-send-btn ai-gmail-generate-btn" aria-label="Generar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13"/>
                <path d="M22 2L15 22L11 13L2 9L22 2z"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="ai-gmail-response" style="display: none;">
          <div class="ai-gmail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Respuesta generada</span>
          </div>
          <div class="ai-gmail-response-content" contenteditable="true"></div>
          <div class="ai-gmail-response-actions">
            <button class="ai-gmail-insert-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Insertar en Gmail
            </button>
            <button class="ai-gmail-copy-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              Copiar
            </button>
            <button class="ai-gmail-regenerate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Regenerar
            </button>
          </div>
        </div>
      </div>
    `;

    // Si hay resumen inicial, renderizarlo
    if (summary) {
      const summaryDiv = dialog.querySelector('.ai-gmail-summary-content');
      MarkdownRenderer.renderToElement(summaryDiv, summary);
    }

    // Hacer el diálogo arrastrable usando la función de DialogModule
    makeDraggable(dialog);

    // Eventos del diálogo
    setupGmailDialogEvents(dialog, emailContent);

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

  function setupGmailDialogEvents(dialog, emailContent) {
    // Botón cerrar
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });

    // Botón generar respuesta
    const generateBtn = dialog.querySelector('.ai-gmail-generate-btn');
    const userInput = dialog.querySelector('.ai-gmail-input');
    const responseSection = dialog.querySelector('.ai-gmail-response');
    const responseContent = dialog.querySelector('.ai-gmail-response-content');

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
        const response = await generateEmailResponse(emailContent, userContent);

        // Renderizar con markdown
        MarkdownRenderer.renderToElement(responseContent, response);
        responseSection.style.display = 'block';

        // Limpiar input
        userInput.value = '';
      } catch (error) {
        alert('Error al generar la respuesta: ' + error.message);
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
    const copyBtn = dialog.querySelector('.ai-gmail-copy-btn');
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
    const regenerateBtn = dialog.querySelector('.ai-gmail-regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        const userContent = userInput.value.trim() || 'Genera una respuesta profesional';

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
          const response = await generateEmailResponse(emailContent, userContent);
          MarkdownRenderer.renderToElement(responseContent, response);
        } catch (error) {
          alert('Error al regenerar: ' + error.message);
        } finally {
          regenerateBtn.disabled = false;
          regenerateBtn.innerHTML = originalHTML;
        }
      });
    }

    // Botón insertar en Gmail
    const insertBtn = dialog.querySelector('.ai-gmail-insert-btn');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        const text = responseContent.innerText;
        insertTextIntoGmail(text);
        dialog.remove();
      });
    }
  }

  async function generateEmailResponse(emailContent, userContent) {
    const prompt = `Correo original:
${emailContent}

Contenido a incluir en la respuesta:
${userContent}

Genera una respuesta profesional y cordial para este correo electrónico, incluyendo el contenido que el usuario ha especificado. La respuesta debe ser clara, bien estructurada y apropiada para un correo electrónico profesional.`;

    const response = await AIModule.aiAnswer(prompt);
    return response;
  }

  function insertTextIntoGmail(text) {
    // Intentar encontrar el botón de responder y hacer click
    const replyButton = document.querySelector('[aria-label*="Responder"]') ||
                        document.querySelector('[data-tooltip*="Responder"]') ||
                        document.querySelector('.ams');
    
    if (replyButton) {
      replyButton.click();
      
      // Esperar a que se abra el editor de respuesta
      setTimeout(() => {
        insertIntoGmailEditor(text);
      }, 500);
    } else {
      // Si ya está abierto el editor, insertar directamente
      insertIntoGmailEditor(text);
    }
  }

  function insertIntoGmailEditor(text) {
    // Buscar el área de texto de composición de Gmail
    const composeBox = document.querySelector('[aria-label*="Cuerpo del mensaje"]') ||
                       document.querySelector('[role="textbox"][aria-label]') ||
                       document.querySelector('.editable[role="textbox"]') ||
                       document.querySelector('div[contenteditable="true"]');
    
    if (composeBox) {
      // Insertar el texto
      composeBox.focus();
      
      // Método 1: Intentar con execCommand
      document.execCommand('insertText', false, text);
      
      // Método 2: Si no funciona, insertar directamente en el HTML
      if (!composeBox.innerText.includes(text.substring(0, 20))) {
        const p = document.createElement('p');
        p.textContent = text;
        composeBox.appendChild(p);
      }
      
      // Disparar evento de input para que Gmail detecte el cambio
      composeBox.dispatchEvent(new Event('input', { bubbles: true }));
      
      console.log('✅ Texto insertado en Gmail');
    } else {
      // Si no se encuentra el editor, copiar al portapapeles
      navigator.clipboard.writeText(text).then(() => {
        alert('Texto copiado al portapapeles. Pégalo manualmente en el editor de Gmail.');
      });
    }
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
  window.GmailModule = publicAPI;

  return publicAPI;
})();

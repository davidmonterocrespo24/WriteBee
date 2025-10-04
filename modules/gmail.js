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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <path d="M8 10h8M8 14h4"/>
      </svg>
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

  function handleAIResponse(emailContainer) {
    console.log('🤖 Generando respuesta AI...');

    // Extraer el contenido del correo
    const emailContent = extractEmailContent(emailContainer);
    
    if (!emailContent) {
      alert('No se pudo extraer el contenido del correo');
      return;
    }

    console.log('📧 Contenido extraído:', emailContent.substring(0, 100) + '...');

    // Crear diálogo especial para Gmail
    const dialog = createGmailDialog(emailContent);
    document.body.appendChild(dialog);

    // Generar resumen del correo automáticamente
    generateEmailSummary(dialog, emailContent);
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

  function createGmailDialog(emailContent) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-gmail-dialog';
    dialog.dataset.pinned = 'true';

    // Centrar en la pantalla
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.width = '600px';
    dialog.style.maxWidth = '90vw';

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="title">📧 Respuesta AI para Gmail</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        <div class="ai-gmail-summary">
          <div class="ai-gmail-section-title">📋 Resumen del correo:</div>
          <div class="ai-gmail-summary-content">Generando resumen...</div>
        </div>

        <div class="ai-gmail-compose">
          <div class="ai-gmail-section-title">✍️ ¿Qué contenido quieres incluir en el correo electrónico?</div>
          <textarea 
            class="ai-gmail-input" 
            placeholder="Escribe aquí las ideas principales que quieres incluir en tu respuesta..."
            rows="4"
          ></textarea>
          <button class="ai-gmail-generate-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
            Generar Respuesta
          </button>
        </div>

        <div class="ai-gmail-response" style="display: none;">
          <div class="ai-gmail-section-title">💬 Respuesta generada:</div>
          <div class="ai-gmail-response-content" contenteditable="true"></div>
          <div class="ai-gmail-response-actions">
            <button class="ai-gmail-insert-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
          </div>
        </div>
      </div>
    `;

    // Hacer el diálogo arrastrable
    makeGmailDialogDraggable(dialog);

    // Eventos del diálogo
    setupGmailDialogEvents(dialog, emailContent);

    return dialog;
  }

  function makeGmailDialogDraggable(dialog) {
    const header = dialog.querySelector('.ai-draggable');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;

    header.addEventListener('mousedown', dragStart);

    function dragStart(e) {
      if (e.target.closest('button')) return;

      initialX = e.clientX - dialog.offsetLeft;
      initialY = e.clientY - dialog.offsetTop;

      isDragging = true;
      dialog.style.transform = 'none'; // Remover el centrado

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

    generateBtn.addEventListener('click', async () => {
      const userContent = userInput.value.trim();
      
      if (!userContent) {
        alert('Por favor, escribe el contenido que quieres incluir en la respuesta');
        return;
      }

      generateBtn.disabled = true;
      generateBtn.innerHTML = '<span style="opacity: 0.6;">Generando...</span>';

      try {
        const response = await generateEmailResponse(emailContent, userContent);
        responseContent.innerHTML = response.replace(/\n/g, '<br>');
        responseSection.style.display = 'block';
      } catch (error) {
        alert('Error al generar la respuesta: ' + error.message);
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Generar Respuesta
        `;
      }
    });

    // Botón copiar
    const copyBtn = dialog.querySelector('.ai-gmail-copy-btn');
    copyBtn.addEventListener('click', () => {
      const text = responseContent.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '✓ Copiado';
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
      });
    });

    // Botón insertar en Gmail
    const insertBtn = dialog.querySelector('.ai-gmail-insert-btn');
    insertBtn.addEventListener('click', () => {
      const text = responseContent.innerText;
      insertTextIntoGmail(text);
      dialog.remove();
    });
  }

  async function generateEmailSummary(dialog, emailContent) {
    const summaryDiv = dialog.querySelector('.ai-gmail-summary-content');
    
    try {
      summaryDiv.textContent = 'Generando resumen...';
      
      const summary = await AIModule.aiSummarize(emailContent, (percent) => {
        summaryDiv.textContent = `Procesando ${percent}%`;
      });

      // Renderizar en markdown
      MarkdownRenderer.renderToElement(summaryDiv, summary);
    } catch (error) {
      summaryDiv.textContent = 'Error al generar resumen: ' + error.message;
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

  return {
    init
  };
})();

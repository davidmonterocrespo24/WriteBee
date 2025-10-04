const LinkedInModule = (function() {
  let linkedinButton = null;
  let isLinkedIn = false;
  let currentContext = null; // 'comment' | 'post'

  function init() {
    // Detectar si estamos en LinkedIn
    isLinkedIn = window.location.hostname.includes('linkedin.com');

    if (isLinkedIn) {
      console.log('💼 LinkedIn detectado, iniciando módulo...');
      observeLinkedIn();
    }
  }

  function observeLinkedIn() {
    // Observar cambios en el DOM para detectar áreas de comentarios y publicaciones
    const observer = new MutationObserver(() => {
      checkForCommentArea();
      checkForPostArea();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Verificar inmediatamente
    setTimeout(() => {
      checkForCommentArea();
      checkForPostArea();
    }, 1000);
  }

  function checkForCommentArea() {
    // Buscar solo el área principal de escritura de comentarios (no los comentarios existentes)
    const commentForms = document.querySelectorAll('.comments-comment-box__form');

    console.log('💼 LinkedIn: Buscando formularios de comentarios...', commentForms.length);

    commentForms.forEach(form => {
      // Buscar si ya existe el botón en este formulario específico
      if (!form.querySelector('.ai-linkedin-btn-comment')) {
        console.log('💼 LinkedIn: Insertando botón en formulario');
        insertCommentButton(form);
      }
    });
  }

  function checkForPostArea() {
    // Buscar el footer del área de creación de posts
    const postFooter = document.querySelector('.share-creation-state__footer .share-creation-state__schedule-and-post-container');

    if (postFooter && !postFooter.querySelector('.ai-linkedin-btn-post')) {
      insertPostButton(postFooter);
    }
  }

  function insertCommentButton(commentForm) {
    console.log('💼 LinkedIn: Creando botón de comentario...');

    const btn = document.createElement('button');
    btn.className = 'ai-linkedin-btn-comment';
    btn.setAttribute('aria-label', 'Respuesta AI');
    btn.setAttribute('type', 'button');
    btn.innerHTML = `
      <span class="artdeco-button__text">Respuesta AI</span>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevenir múltiples diálogos
      if (document.querySelector('.ai-linkedin-dialog')) {
        console.log('💼 LinkedIn: Ya hay un diálogo abierto');
        return;
      }

      console.log('💼 LinkedIn: Click en botón de comentario');
      handleCommentResponse(commentForm, btn);
    });

    // Buscar el contenedor de botones en la parte inferior derecha
    const bottomRightContainer = commentForm.querySelector('.display-flex.justify-space-between .display-flex.align-items-center');

    console.log('💼 LinkedIn: bottomRightContainer encontrado:', bottomRightContainer);

    if (bottomRightContainer) {
      bottomRightContainer.appendChild(btn);
      console.log('💼 LinkedIn: Botón insertado correctamente');
    } else {
      console.log('💼 LinkedIn: No se encontró contenedor derecho');
    }
  }

  function insertPostButton(postFooterContainer) {
    const btn = document.createElement('button');
    btn.className = 'ai-linkedin-btn-post';
    btn.setAttribute('aria-label', 'Generar con AI');
    btn.setAttribute('type', 'button');
    btn.style.cssText = 'margin-right: 8px;';
    btn.innerHTML = `
      <span class="artdeco-button__text">Generar con AI</span>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevenir múltiples diálogos
      if (document.querySelector('.ai-linkedin-dialog')) {
        console.log('💼 LinkedIn: Ya hay un diálogo abierto');
        return;
      }

      handleCreatePost();
    });

    // Insertar antes del botón de programar (reloj)
    const scheduleBtn = postFooterContainer.querySelector('.share-creation-state__schedule-clock-btn');
    if (scheduleBtn) {
      postFooterContainer.insertBefore(btn, scheduleBtn);
    } else {
      postFooterContainer.appendChild(btn);
    }
  }

  async function handleCommentResponse(commentBox, buttonElement) {
    console.log('💬 Generando respuesta de comentario...');

    // Extraer el contexto del post/comentario
    const postContent = extractPostContent(commentBox);
    console.log('💬 Contenido extraído:', postContent);

    if (!postContent) {
      console.log('❌ No se pudo extraer contenido');
      alert('No se pudo extraer el contenido del post');
      return;
    }

    // Crear diálogo para responder comentarios
    console.log('💬 Creando diálogo...');
    const dialog = createCommentDialog(postContent, buttonElement);
    console.log('💬 Diálogo creado:', dialog);
    document.body.appendChild(dialog);
    console.log('💬 Diálogo añadido al body');
  }

  function handleCreatePost() {
    console.log('📝 Creando publicación...');

    // Crear diálogo para crear publicación
    const dialog = createPostDialog();
    document.body.appendChild(dialog);
  }

  function extractPostContent(commentBox) {
    // Intentar extraer el contenido del post padre
    const postContainer = commentBox.closest('.feed-shared-update-v2, .occludable-update');

    if (postContainer) {
      const content = postContainer.querySelector('.feed-shared-text, .break-words');
      return content ? content.innerText : 'Post de LinkedIn';
    }

    return 'Post de LinkedIn';
  }

  function createCommentDialog(postContext, buttonElement) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-linkedin-dialog';
    dialog.dataset.pinned = 'true';

    // Posicionar el diálogo cerca del botón
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const dialogWidth = 520;
      const dialogHeight = 600;

      // Posicionar a la derecha del botón, alineado verticalmente
      let left = rect.right + 20; // 20px de separación del botón
      let top = rect.top + window.scrollY; // Usar scrollY para considerar el scroll de la página

      // Si se sale de la pantalla a la derecha, posicionar a la izquierda del botón
      if (left + dialogWidth > window.innerWidth) {
        left = rect.left - dialogWidth - 20;
      }

      // Si aún se sale a la izquierda, centrar en pantalla
      if (left < 20) {
        left = (window.innerWidth - dialogWidth) / 2;
      }

      // Asegurar que no se salga por arriba
      if (top < window.scrollY + 20) {
        top = window.scrollY + 20;
      }

      // Asegurar que no se salga por abajo
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

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="LinkedIn AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">Respuesta de AI</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn pin-btn" aria-label="Fijar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 17v5M9 3l6 0M8 7l8 0M6 7c0 3 2 6 6 6s6-3 6-6"/>
          </svg>
        </button>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        <div class="ai-linkedin-context">
          <div class="ai-linkedin-context-label">📌 Contexto del post:</div>
          <div class="ai-linkedin-context-content">${postContext.substring(0, 200)}${postContext.length > 200 ? '...' : ''}</div>
        </div>

        <div class="ai-linkedin-input-section">
          <textarea
            class="ai-linkedin-textarea"
            placeholder="Dime cómo quieres modificarlo"
            rows="4"
          ></textarea>
        </div>

        <div class="ai-linkedin-actions">
          <button class="ai-linkedin-chip" data-tone="support">
            <span class="emoji">🧠</span>Apoyar
          </button>
          <button class="ai-linkedin-chip" data-tone="oppose">
            <span class="emoji">🪪</span>Oponerse
          </button>
          <button class="ai-linkedin-chip" data-tone="discuss">
            <span class="emoji">💬</span>Discutir
          </button>
          <button class="ai-linkedin-chip" data-tone="question">
            <span class="emoji">❓</span>Preguntar
          </button>
          <div class="spacer"></div>
          <div class="ai-linkedin-lang">
            <span>🌐</span>
            <select class="ai-linkedin-lang-select">
              <option value="es">español</option>
              <option value="en">english</option>
              <option value="fr">français</option>
              <option value="de">deutsch</option>
            </select>
          </div>
        </div>

        <div class="ai-linkedin-response" style="display: none;">
          <div class="ai-linkedin-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Respuesta generada</span>
          </div>
          <div class="ai-linkedin-response-content" contenteditable="true"></div>
          <div class="ai-linkedin-response-actions">
            <button class="ai-linkedin-insert-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Insertar
            </button>
            <button class="ai-linkedin-copy-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              Copiar
            </button>
            <button class="ai-linkedin-regenerate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Regenerar
            </button>
          </div>
        </div>
      </div>

      <div class="ai-linkedin-footer">
        <button class="ai-linkedin-generate-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13"/>
            <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
          Generar
        </button>
      </div>
    `;

    makeDraggable(dialog);
    setupCommentDialogEvents(dialog, postContext);

    return dialog;
  }

  function createPostDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-linkedin-dialog';
    dialog.dataset.pinned = 'true';

    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.width = 'min(560px, 92vw)';

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="LinkedIn AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">Publicación AI</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-linkedin-toolbar">
        <div class="ai-linkedin-dropdown">
          <button class="ai-linkedin-dropdown-trigger">
            <span class="selected-template">Seleccionar Plantilla</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          <div class="ai-linkedin-dropdown-menu">
            <button class="ai-linkedin-template-item" data-template="insights">
              <div class="template-icon">🚀</div>
              <div class="template-name">Compartir percepciones profesionales</div>
            </button>
            <button class="ai-linkedin-template-item" data-template="milestone">
              <div class="template-icon">🎉</div>
              <div class="template-name">Celebrar un hito profesional</div>
            </button>
            <button class="ai-linkedin-template-item" data-template="learning">
              <div class="template-icon">📚</div>
              <div class="template-name">Compartir aprendizajes</div>
            </button>
            <button class="ai-linkedin-template-item" data-template="question">
              <div class="template-icon">💭</div>
              <div class="template-name">Hacer una pregunta a la comunidad</div>
            </button>
            <button class="ai-linkedin-template-item" data-template="announcement">
              <div class="template-icon">📢</div>
              <div class="template-name">Anunciar algo importante</div>
            </button>
            <button class="ai-linkedin-template-item" data-template="tips">
              <div class="template-icon">💡</div>
              <div class="template-name">Compartir consejos útiles</div>
            </button>
          </div>
        </div>
      </div>

      <div class="ai-result-body">
        <div class="ai-linkedin-input-section">
          <textarea
            class="ai-linkedin-textarea ai-linkedin-post-textarea"
            placeholder="Dime qué quieres escribir"
            rows="6"
          ></textarea>
        </div>

        <div class="ai-linkedin-response" style="display: none;">
          <div class="ai-linkedin-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Publicación generada</span>
          </div>
          <div class="ai-linkedin-response-content" contenteditable="true"></div>
          <div class="ai-linkedin-response-actions">
            <button class="ai-linkedin-insert-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Insertar
            </button>
            <button class="ai-linkedin-copy-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              Copiar
            </button>
            <button class="ai-linkedin-regenerate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Regenerar
            </button>
          </div>
        </div>
      </div>

      <div class="ai-linkedin-footer">
        <div class="ai-linkedin-lang">
          <span>🌐</span>
          <select class="ai-linkedin-lang-select">
            <option value="es">español</option>
            <option value="en">english</option>
            <option value="fr">français</option>
            <option value="de">deutsch</option>
          </select>
        </div>
        <button class="ai-linkedin-generate-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13"/>
            <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
          Generar
        </button>
      </div>
    `;

    makeDraggable(dialog);
    setupPostDialogEvents(dialog);

    return dialog;
  }

  function makeDraggable(dialog) {
    const header = dialog.querySelector('.ai-draggable');
    let isDragging = false;
    let currentX, currentY, initialX, initialY;

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

  function setupCommentDialogEvents(dialog, postContext) {
    const closeBtn = dialog.querySelector('.close-panel');
    const pinBtn = dialog.querySelector('.pin-btn');
    const textarea = dialog.querySelector('.ai-linkedin-textarea');
    const generateBtn = dialog.querySelector('.ai-linkedin-generate-btn');
    const chips = dialog.querySelectorAll('.ai-linkedin-chip');
    const langSelect = dialog.querySelector('.ai-linkedin-lang-select');
    const responseSection = dialog.querySelector('.ai-linkedin-response');
    const responseContent = dialog.querySelector('.ai-linkedin-response-content');

    let selectedTone = '';

    // Cerrar
    closeBtn.addEventListener('click', () => dialog.remove());

    // Pin
    pinBtn.addEventListener('click', () => {
      if (dialog.dataset.pinned === 'true') {
        dialog.dataset.pinned = 'false';
        pinBtn.style.color = '';
      } else {
        dialog.dataset.pinned = 'true';
        pinBtn.style.color = '#8ab4ff';
      }
    });

    // Chips de tono
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedTone = chip.dataset.tone;
      });
    });

    // Generar
    generateBtn.addEventListener('click', async () => {
      const userInput = textarea.value.trim();
      const language = langSelect.value;

      if (!userInput && !selectedTone) {
        textarea.focus();
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
        Generando...
      `;

      try {
        const response = await generateCommentResponse(postContext, userInput, selectedTone, language);

        MarkdownRenderer.renderToElement(responseContent, response);
        responseSection.style.display = 'block';
        textarea.value = '';

        // Hacer scroll automático hacia la respuesta generada
        setTimeout(() => {
          responseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          // También enfocar el contenido editable para que el usuario pueda editarlo inmediatamente
          responseContent.focus();
        }, 100);
      } catch (error) {
        alert('Error: ' + error.message);
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalHTML;
      }
    });

    // Insertar en comentario
    const insertBtn = dialog.querySelector('.ai-linkedin-insert-btn');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        const text = responseContent.innerText;

        // Buscar el editor de texto del comentario
        const commentForm = document.querySelector('.comments-comment-box__form');
        if (commentForm) {
          const editor = commentForm.querySelector('.ql-editor');
          if (editor) {
            editor.innerHTML = `<p>${text}</p>`;
            editor.focus();

            // Feedback visual
            const originalHTML = insertBtn.innerHTML;
            insertBtn.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Insertado
            `;
            setTimeout(() => {
              insertBtn.innerHTML = originalHTML;
            }, 2000);

            // Cerrar el diálogo después de insertar
            setTimeout(() => {
              dialog.remove();
            }, 1000);
          }
        }
      });
    }

    // Copiar
    const copyBtn = dialog.querySelector('.ai-linkedin-copy-btn');
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

    // Regenerar
    const regenerateBtn = dialog.querySelector('.ai-linkedin-regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        const userInput = textarea.value.trim() || '';
        const language = langSelect.value;

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
          const response = await generateCommentResponse(postContext, userInput, selectedTone, language);
          MarkdownRenderer.renderToElement(responseContent, response);
        } catch (error) {
          alert('Error: ' + error.message);
        } finally {
          regenerateBtn.disabled = false;
          regenerateBtn.innerHTML = originalHTML;
        }
      });
    }
  }

  function setupPostDialogEvents(dialog) {
    const closeBtn = dialog.querySelector('.close-panel');
    const textarea = dialog.querySelector('.ai-linkedin-post-textarea');
    const generateBtn = dialog.querySelector('.ai-linkedin-generate-btn');
    const dropdown = dialog.querySelector('.ai-linkedin-dropdown');
    const dropdownTrigger = dialog.querySelector('.ai-linkedin-dropdown-trigger');
    const dropdownMenu = dialog.querySelector('.ai-linkedin-dropdown-menu');
    const templateItems = dialog.querySelectorAll('.ai-linkedin-template-item');
    const selectedTemplateSpan = dialog.querySelector('.selected-template');
    const langSelect = dialog.querySelector('.ai-linkedin-lang-select');
    const responseSection = dialog.querySelector('.ai-linkedin-response');
    const responseContent = dialog.querySelector('.ai-linkedin-response-content');

    let selectedTemplate = null;

    // Cerrar
    closeBtn.addEventListener('click', () => dialog.remove());

    // Dropdown
    dropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });

    // Templates
    templateItems.forEach(item => {
      item.addEventListener('click', () => {
        selectedTemplate = item.dataset.template;
        selectedTemplateSpan.textContent = item.querySelector('.template-name').textContent;
        dropdown.classList.remove('open');

        templateItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });

    // Habilitar generar cuando hay texto o plantilla seleccionada
    textarea.addEventListener('input', () => {
      generateBtn.disabled = false;
    });

    // Generar
    generateBtn.addEventListener('click', async () => {
      const userInput = textarea.value.trim();
      const language = langSelect.value;

      if (!userInput) {
        textarea.focus();
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
        Generando...
      `;

      try {
        const response = await generatePostContent(userInput, selectedTemplate, language);

        MarkdownRenderer.renderToElement(responseContent, response);
        responseSection.style.display = 'block';
        textarea.value = '';
        generateBtn.disabled = true;
      } catch (error) {
        alert('Error: ' + error.message);
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalHTML;
      }
    });

    // Insertar en publicación
    const insertBtn = dialog.querySelector('.ai-linkedin-insert-btn');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        const text = responseContent.innerText;

        // Buscar el editor de texto de la publicación de LinkedIn
        const shareBox = document.querySelector('.share-creation-state__text-editor');
        if (shareBox) {
          const editor = shareBox.querySelector('.ql-editor');
          if (editor) {
            editor.innerHTML = `<p>${text}</p>`;
            editor.focus();

            // Feedback visual
            const originalHTML = insertBtn.innerHTML;
            insertBtn.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Insertado
            `;
            setTimeout(() => {
              insertBtn.innerHTML = originalHTML;
            }, 2000);

            // Cerrar el diálogo después de insertar
            setTimeout(() => {
              dialog.remove();
            }, 1000);
          }
        }
      });
    }

    // Copiar
    const copyBtn = dialog.querySelector('.ai-linkedin-copy-btn');
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

    // Regenerar
    const regenerateBtn = dialog.querySelector('.ai-linkedin-regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        const userInput = textarea.value.trim() || responseContent.innerText;
        const language = langSelect.value;

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
          const response = await generatePostContent(userInput, selectedTemplate, language);
          MarkdownRenderer.renderToElement(responseContent, response);
        } catch (error) {
          alert('Error: ' + error.message);
        } finally {
          regenerateBtn.disabled = false;
          regenerateBtn.innerHTML = originalHTML;
        }
      });
    }
  }

  async function generateCommentResponse(postContext, userInput, tone, language) {
    let toneInstruction = '';

    switch (tone) {
      case 'support':
        toneInstruction = 'Escribe un comentario de apoyo y positivo.';
        break;
      case 'oppose':
        toneInstruction = 'Escribe un comentario educado pero que exprese desacuerdo.';
        break;
      case 'discuss':
        toneInstruction = 'Escribe un comentario que invite a la discusión constructiva.';
        break;
      case 'question':
        toneInstruction = 'Escribe un comentario con preguntas relevantes.';
        break;
      default:
        toneInstruction = 'Escribe un comentario profesional y reflexivo.';
    }

    const prompt = `Contexto del post de LinkedIn:
${postContext}

Instrucciones del usuario:
${userInput || 'Genera un comentario apropiado'}

${toneInstruction}

Idioma: ${language}

Genera un comentario profesional para LinkedIn que sea auténtico, conciso (2-4 oraciones) y apropiado para una red profesional. Evita ser demasiado formal o robótico.`;

    const response = await AIModule.aiAnswer(prompt);
    return response;
  }

  async function generatePostContent(userInput, template, language) {
    let templateInstruction = '';

    switch (template) {
      case 'insights':
        templateInstruction = 'Estructura: Insight principal → Explicación breve → Conclusión/Llamado a la acción';
        break;
      case 'milestone':
        templateInstruction = 'Estructura: Logro/Hito → Contexto/Camino → Agradecimientos → Siguiente paso';
        break;
      case 'learning':
        templateInstruction = 'Estructura: Aprendizaje clave → Historia/Ejemplo → Lecciones aplicables';
        break;
      case 'question':
        templateInstruction = 'Estructura: Contexto breve → Pregunta clara → ¿Por qué es importante?';
        break;
      case 'announcement':
        templateInstruction = 'Estructura: Anuncio principal → Detalles clave → Impacto/Valor';
        break;
      case 'tips':
        templateInstruction = 'Estructura: Introducción → Lista de consejos (3-5) → Conclusión';
        break;
      default:
        templateInstruction = 'Estructura clara y profesional';
    }

    const prompt = `Tema/Idea de publicación:
${userInput}

Plantilla: ${template || 'general'}
${templateInstruction}

Idioma: ${language}

Genera una publicación profesional para LinkedIn que sea:
- Auténtica y personal
- Bien estructurada con párrafos cortos
- Incluya emojis sutiles donde sea apropiado (máximo 2-3)
- Termine con una pregunta o llamado a la interacción
- Longitud: 150-300 palabras

No uses hashtags excesivos, máximo 3-5 al final si son relevantes.`;

    const response = await AIModule.aiAnswer(prompt);
    return response;
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

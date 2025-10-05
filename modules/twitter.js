const TwitterModule = (function() {
  let twitterButtons = new Set();
  let isTwitter = false;

  function init() {
    // Detectar si estamos en Twitter/X
    isTwitter = window.location.hostname.includes('twitter.com') || 
                window.location.hostname.includes('x.com');

    if (isTwitter) {
      console.log('🐦 Twitter/X detectado, iniciando módulo...');
      observeTwitter();
    }
  }

  function observeTwitter() {
    // Observar cambios en el DOM para detectar áreas de tweets y respuestas
    const observer = new MutationObserver(() => {
      checkForTweetComposer();
      checkForReplyBoxes();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Verificar inmediatamente
    setTimeout(() => {
      checkForTweetComposer();
      checkForReplyBoxes();
    }, 1500);
  }

  function checkForTweetComposer() {
    // Buscar todas las toolbars (incluyendo el compositor principal de tweets)
    const toolbars = document.querySelectorAll('[data-testid="toolBar"]');

    console.log('🐦 Twitter: Buscando toolbars para compositor...', toolbars.length);

    toolbars.forEach(toolbar => {
      // Verificar si ya tiene el botón AI de tweet
      if (toolbar.querySelector('.ai-twitter-btn-tweet')) {
        return;
      }

      // Buscar si esta toolbar tiene el compositor principal (tweetTextarea_0)
      const mainComposer = toolbar.closest('div')?.querySelector('[data-testid="tweetTextarea_0"]');

      // Solo insertar en el compositor principal del home (no en respuestas)
      if (mainComposer) {
        const isInMainTimeline = !toolbar.closest('[role="dialog"]');

        if (isInMainTimeline) {
          const buttonList = toolbar.querySelector('[data-testid="ScrollSnap-List"]');

          if (buttonList && !buttonList.querySelector('.ai-twitter-btn-tweet')) {
            console.log('🐦 Twitter: Insertando botón en compositor principal');
            insertTweetButton(buttonList, toolbar);
          }
        }
      }
    });
  }

  function checkForReplyBoxes() {
    // Buscar todas las toolbars
    const toolbars = document.querySelectorAll('[data-testid="toolBar"]');

    console.log('🐦 Twitter: Buscando toolbars...', toolbars.length);

    toolbars.forEach(toolbar => {
      // Verificar si ya tiene el botón AI
      if (toolbar.querySelector('.ai-twitter-btn-reply')) {
        return;
      }

      // Buscar la lista de botones dentro de la toolbar
      const buttonList = toolbar.querySelector('[data-testid="ScrollSnap-List"]');

      if (buttonList) {
        console.log('🐦 Twitter: Insertando botón en toolbar');
        insertReplyButton(buttonList, toolbar);
      }
    });
  }

  function insertTweetButton(buttonList, toolbar) {
    console.log('🐦 Twitter: Creando botón de tweet...');

    // Crear contenedor con la misma estructura que los otros botones
    const buttonWrapper = document.createElement('div');
    buttonWrapper.setAttribute('role', 'presentation');
    buttonWrapper.className = 'css-175oi2r r-14tvyh0 r-cpa5s6';

    const btn = document.createElement('button');
    btn.className = 'ai-twitter-btn-tweet css-175oi2r r-sdzlij r-1phboty r-rs99b7 r-lrvibr r-2yi16 r-1qi8awa r-1loqt21 r-o7ynqc r-6416eg r-1ny4l3l';
    btn.setAttribute('aria-label', 'Generar con AI');
    btn.setAttribute('role', 'button');
    btn.setAttribute('type', 'button');
    btn.style.cssText = 'background-color: rgba(0, 0, 0, 0); border-color: rgba(0, 0, 0, 0);';

    btn.innerHTML = `
      <div dir="ltr" class="css-146c3p1 r-bcqeeo r-qvutc0 r-37j5jr r-q4m81j r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-18u37iz r-16y2uox r-1777fci" style="color: rgb(29, 155, 240);">
        <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-z80fyv r-19wmn03" style="color: rgb(29, 155, 240);">
          <g><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M12 8v6M8 11h8" fill="none" stroke="currentColor" stroke-width="2"/></g>
        </svg>
        <span class="css-1jxf684 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3 r-a023e6 r-rjixqe"></span>
      </div>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevenir múltiples diálogos
      if (document.querySelector('.ai-twitter-dialog')) {
        console.log('🐦 Twitter: Ya hay un diálogo abierto');
        return;
      }

      console.log('🐦 Twitter: Click en botón de tweet');
      // Buscar el textarea asociado
      const textarea = toolbar.closest('[data-testid="toolBar"]')?.parentElement?.parentElement?.querySelector('[data-testid="tweetTextarea_0"]');
      if (textarea) {
        handleCreateTweet(textarea, btn);
      }
    });

    buttonWrapper.appendChild(btn);
    buttonList.appendChild(buttonWrapper);
    twitterButtons.add(btn);
    console.log('🐦 Twitter: Botón insertado correctamente');
  }

  function insertReplyButton(buttonList, toolbar) {
    console.log('🐦 Twitter: Creando botón de respuesta...');

    // Crear contenedor con la misma estructura que los otros botones
    const buttonWrapper = document.createElement('div');
    buttonWrapper.setAttribute('role', 'presentation');
    buttonWrapper.className = 'css-175oi2r r-14tvyh0 r-cpa5s6';

    const btn = document.createElement('button');
    btn.className = 'ai-twitter-btn-reply css-175oi2r r-sdzlij r-1phboty r-rs99b7 r-lrvibr r-2yi16 r-1qi8awa r-1loqt21 r-o7ynqc r-6416eg r-1ny4l3l';
    btn.setAttribute('aria-label', 'Respuesta AI');
    btn.setAttribute('role', 'button');
    btn.setAttribute('type', 'button');
    btn.style.cssText = 'background-color: rgba(0, 0, 0, 0); border-color: rgba(0, 0, 0, 0);';

    btn.innerHTML = `
      <div dir="ltr" class="css-146c3p1 r-bcqeeo r-qvutc0 r-37j5jr r-q4m81j r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-18u37iz r-16y2uox r-1777fci" style="color: rgb(29, 155, 240);">
        <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-lrvibr r-m6rgpd r-z80fyv r-19wmn03" style="color: rgb(29, 155, 240);">
          <g><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z M8 10h8M8 14h4" fill="none" stroke="currentColor" stroke-width="2"/></g>
        </svg>
        <span class="css-1jxf684 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3 r-a023e6 r-rjixqe"></span>
      </div>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevenir múltiples diálogos
      if (document.querySelector('.ai-twitter-dialog')) {
        console.log('🐦 Twitter: Ya hay un diálogo abierto');
        return;
      }

      console.log('🐦 Twitter: Click en botón de respuesta');

      // Buscar el contenido del tweet para dar contexto
      const toolbarElement = toolbar.closest('[data-testid="toolBar"]');

      // Intentar extraer contexto del tweet
      let tweetContext = null;
      try {
        // Buscar el tweet container más cercano
        const tweetArticle = toolbarElement?.closest('article');
        console.log('🐦 Twitter: Article encontrado:', tweetArticle);

        if (tweetArticle) {
          const tweetText = tweetArticle.querySelector('[data-testid="tweetText"]');
          console.log('🐦 Twitter: TweetText encontrado:', tweetText);

          if (tweetText) {
            tweetContext = tweetText.innerText || tweetText.textContent;
            console.log('🐦 Twitter: Contexto extraído:', tweetContext);
          }
        }
      } catch (err) {
        console.log('⚠️ Error extrayendo contexto:', err);
      }

      // Crear diálogo directamente
      console.log('🐦 Twitter: Creando diálogo de respuesta...');
      const dialog = createTweetDialog(tweetContext, btn);
      console.log('🐦 Twitter: Diálogo creado:', dialog);
      document.body.appendChild(dialog);
      console.log('🐦 Twitter: Diálogo añadido al body');

      // Verificar que está en el DOM
      setTimeout(() => {
        const dialogInDom = document.querySelector('.ai-twitter-dialog');
        console.log('🐦 Twitter: Diálogo en DOM después de 100ms:', dialogInDom);
      }, 100);
    });

    buttonWrapper.appendChild(btn);
    buttonList.appendChild(buttonWrapper);
    twitterButtons.add(btn);
    console.log('🐦 Twitter: Botón insertado correctamente');
  }

  async function handleCreateTweet(composer, buttonElement) {
    console.log('📝 Creando tweet...');

    // Crear diálogo para crear tweet
    const dialog = createTweetDialog(null, buttonElement);
    document.body.appendChild(dialog);
  }

  async function handleReplyToTweet(replyBox, buttonElement) {
    console.log('💬 Generando respuesta a tweet...');
    console.log('💬 ReplyBox recibido:', replyBox);
    console.log('💬 ButtonElement recibido:', buttonElement);

    // Extraer el contexto del tweet original
    const tweetContent = extractTweetContent(replyBox);
    console.log('💬 Contenido del tweet extraído:', tweetContent);

    if (!tweetContent) {
      console.log('❌ No se pudo extraer contenido del tweet');
      // No mostrar alert, crear diálogo vacío
      console.log('💬 Creando diálogo sin contexto...');
    }

    // Crear diálogo para responder
    console.log('💬 Llamando a createTweetDialog...');
    const dialog = createTweetDialog(tweetContent, buttonElement);
    console.log('💬 Diálogo creado:', dialog);
    document.body.appendChild(dialog);
    console.log('💬 Diálogo añadido al body');
  }

  function extractTweetContent(replyBox) {
    // Intentar extraer el contenido del tweet padre
    const tweetContainer = replyBox.closest('[data-testid="tweet"]') || 
                          replyBox.closest('article');

    if (tweetContainer) {
      const tweetText = tweetContainer.querySelector('[data-testid="tweetText"]');
      if (tweetText) {
        return tweetText.innerText || tweetText.textContent;
      }
    }

    // Buscar en el timeline
    const articles = document.querySelectorAll('article[data-testid="tweet"]');
    if (articles.length > 0) {
      const firstTweet = articles[0].querySelector('[data-testid="tweetText"]');
      if (firstTweet) {
        return firstTweet.innerText || firstTweet.textContent;
      }
    }

    return null;
  }

  function createTweetDialog(tweetContext, buttonElement) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-twitter-dialog';
    dialog.dataset.pinned = 'true';

    const isReply = tweetContext !== null;

    // Posicionar el diálogo
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const dialogWidth = 520;
      const dialogHeight = 600;

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

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="Twitter AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">${isReply ? 'Respuesta AI' : 'Crear Tweet'}</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        ${isReply ? `
        <div class="ai-twitter-context">
          <div class="ai-twitter-context-label">📌 Tweet original:</div>
          <div class="ai-twitter-context-content">${tweetContext.substring(0, 200)}${tweetContext.length > 200 ? '...' : ''}</div>
        </div>
        ` : ''}

        <div class="ai-twitter-input-section">
          <textarea
            class="ai-twitter-textarea"
            placeholder="${isReply ? '¿Cómo quieres responder?' : '¿Qué quieres tweetear?'}"
            rows="4"
          ></textarea>
        </div>

        <div class="ai-twitter-actions">
          ${isReply ? `
          <button class="ai-twitter-chip" data-tone="support">
            <span class="emoji">👍</span>Apoyar
          </button>
          <button class="ai-twitter-chip" data-tone="funny">
            <span class="emoji">😄</span>Gracioso
          </button>
          <button class="ai-twitter-chip" data-tone="question">
            <span class="emoji">❓</span>Preguntar
          </button>
          <button class="ai-twitter-chip" data-tone="disagree">
            <span class="emoji">🤔</span>Discrepar
          </button>
          ` : `
          <button class="ai-twitter-chip" data-tone="informative">
            <span class="emoji">📚</span>Informativo
          </button>
          <button class="ai-twitter-chip" data-tone="casual">
            <span class="emoji">😎</span>Casual
          </button>
          <button class="ai-twitter-chip" data-tone="professional">
            <span class="emoji">💼</span>Profesional
          </button>
          <button class="ai-twitter-chip" data-tone="viral">
            <span class="emoji">🚀</span>Viral
          </button>
          `}
          <div class="spacer"></div>
          <div class="ai-twitter-lang">
            <span>🌐</span>
            <select class="ai-twitter-lang-select">
              <option value="es">español</option>
              <option value="en">english</option>
              <option value="fr">français</option>
              <option value="de">deutsch</option>
            </select>
          </div>
        </div>

        <div class="ai-twitter-response" style="display: none;">
          <div class="ai-twitter-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Tweet generado</span>
          </div>
          <div class="ai-twitter-response-content" contenteditable="true"></div>
          <div class="ai-twitter-char-count">
            <span class="ai-twitter-chars">0</span> / 280
          </div>
          <div class="ai-twitter-response-actions">
            <button class="ai-twitter-insert-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Insertar
            </button>
            <button class="ai-twitter-copy-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              Copiar
            </button>
            <button class="ai-twitter-regenerate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Regenerar
            </button>
          </div>
        </div>
      </div>

      <div class="ai-twitter-footer">
        <button class="ai-twitter-generate-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          Generar
        </button>
      </div>
    `;

    // Hacer el diálogo arrastrable
    makeDraggable(dialog);

    // Configurar eventos
    setupTwitterDialogEvents(dialog, tweetContext);

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
      const rect = dialog.getBoundingClientRect();
      initialX = e.clientX - rect.left;
      initialY = e.clientY - rect.top;

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

  function setupTwitterDialogEvents(dialog, tweetContext) {
    const closeBtn = dialog.querySelector('.close-panel');
    const generateBtn = dialog.querySelector('.ai-twitter-generate-btn');
    const userInput = dialog.querySelector('.ai-twitter-textarea');
    const responseSection = dialog.querySelector('.ai-twitter-response');
    const responseContent = dialog.querySelector('.ai-twitter-response-content');
    const charCount = dialog.querySelector('.ai-twitter-chars');
    const chips = dialog.querySelectorAll('.ai-twitter-chip');
    const langSelect = dialog.querySelector('.ai-twitter-lang-select');

    let selectedTone = null;

    // Cerrar diálogo
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });

    // Seleccionar tono
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedTone = chip.dataset.tone;
      });
    });

    // Generar tweet
    const generateTweet = async () => {
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
        Generando...
      `;

      try {
        const language = langSelect.value;
        const tweet = await generateTweetText(tweetContext, userContent, selectedTone, language);

        // Renderizar con markdown
        MarkdownRenderer.renderToElement(responseContent, tweet);
        
        // Actualizar contador de caracteres
        updateCharCount(responseContent, charCount);
        
        responseSection.style.display = 'block';
        userInput.value = '';
      } catch (error) {
        alert('Error al generar el tweet: ' + error.message);
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalHTML;
      }
    };

    generateBtn.addEventListener('click', generateTweet);

    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateTweet();
      }
    });

    // Actualizar contador al editar
    responseContent.addEventListener('input', () => {
      updateCharCount(responseContent, charCount);
    });

    // Botón copiar
    const copyBtn = dialog.querySelector('.ai-twitter-copy-btn');
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
    const regenerateBtn = dialog.querySelector('.ai-twitter-regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        const userContent = userInput.value.trim() || 'Genera un tweet interesante';
        
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
          const language = langSelect.value;
          const tweet = await generateTweetText(tweetContext, userContent, selectedTone, language);
          MarkdownRenderer.renderToElement(responseContent, tweet);
          updateCharCount(responseContent, charCount);
        } catch (error) {
          alert('Error al regenerar: ' + error.message);
        } finally {
          regenerateBtn.disabled = false;
          regenerateBtn.innerHTML = originalHTML;
        }
      });
    }

    // Botón insertar
    const insertBtn = dialog.querySelector('.ai-twitter-insert-btn');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        const text = responseContent.innerText;
        insertTextIntoTwitter(text);
        dialog.remove();
      });
    }
  }

  function updateCharCount(element, countElement) {
    const text = element.innerText || element.textContent;
    const count = text.length;
    countElement.textContent = count;
    
    // Cambiar color según el límite
    if (count > 280) {
      countElement.style.color = '#ff6b6b';
    } else if (count > 260) {
      countElement.style.color = '#ff9e64';
    } else {
      countElement.style.color = '#a5a7b1';
    }
  }

  async function generateTweetText(originalTweet, userContent, tone, language) {
    let prompt = '';
    
    const toneDescriptions = {
      // Para respuestas
      support: 'apoyando y estando de acuerdo con el tweet',
      funny: 'con humor y siendo gracioso',
      question: 'haciendo una pregunta relevante',
      disagree: 'expresando desacuerdo de forma respetuosa',
      // Para tweets nuevos
      informative: 'informativo y educativo',
      casual: 'casual y relajado',
      professional: 'profesional y formal',
      viral: 'llamativo y con potencial viral'
    };

    const languageNames = {
      es: 'español',
      en: 'inglés',
      fr: 'francés',
      de: 'alemán'
    };

    if (originalTweet) {
      // Es una respuesta
      prompt = `Tweet original:
"${originalTweet}"

Genera una respuesta ${tone ? toneDescriptions[tone] : 'apropiada'} basada en estas instrucciones:
${userContent}

Idioma: ${languageNames[language] || 'español'}

IMPORTANTE:
- Máximo 280 caracteres
- Tono ${tone ? toneDescriptions[tone] : 'natural y conversacional'}
- NO uses hashtags excesivos
- Sé conciso y directo
- Responde al tweet directamente`;
    } else {
      // Es un tweet nuevo
      prompt = `Genera un tweet ${tone ? toneDescriptions[tone] : 'interesante'} sobre:
${userContent}

Idioma: ${languageNames[language] || 'español'}

IMPORTANTE:
- Máximo 280 caracteres
- Tono ${tone ? toneDescriptions[tone] : 'natural y atractivo'}
- Usa 1-2 hashtags relevantes
- Sé conciso y llamativo
- Que genere engagement`;
    }

    const response = await AIModule.aiAnswer(prompt);
    return response;
  }

  function insertTextIntoTwitter(text) {
    // Buscar el textarea activo de Twitter
    const activeTextarea = document.querySelector('[data-testid="tweetTextarea_0"]');
    
    if (activeTextarea) {
      // Enfocar el textarea
      activeTextarea.focus();
      
      // Método 1: Usar execCommand
      document.execCommand('insertText', false, text);
      
      // Método 2: Si no funciona, insertar directamente
      if (!activeTextarea.textContent.includes(text.substring(0, 20))) {
        activeTextarea.textContent = text;
      }
      
      // Disparar eventos para que Twitter detecte el cambio
      activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      activeTextarea.dispatchEvent(new Event('change', { bubbles: true }));
      
      console.log('✅ Texto insertado en Twitter');
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(text).then(() => {
        alert('Texto copiado al portapapeles. Pégalo en Twitter (Ctrl+V).');
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

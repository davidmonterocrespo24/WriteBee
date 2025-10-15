const TwitterModule = (function() {
  let twitterButtons = new Set();
  let isTwitter = false;

  function init() {
    // Detectar si estamos en Twitter/X
    isTwitter = window.location.hostname.includes('twitter.com') || 
                window.location.hostname.includes('x.com');

    if (isTwitter) {

      observeTwitter();
    }
  }

  function observeTwitter() {
    // Observe DOM changes to detect tweet areas and responses
    const observer = new MutationObserver(() => {
      checkForTweetComposer();
      checkForReplyBoxes();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Check immediately
    setTimeout(() => {
      checkForTweetComposer();
      checkForReplyBoxes();
    }, 1500);
  }

  function checkForTweetComposer() {
    // Find all toolbars (including the main tweet composer)
    const toolbars = document.querySelectorAll('[data-testid="toolBar"]');

    toolbars.forEach(toolbar => {
      // Check if it already has the AI tweet button
      if (toolbar.querySelector('.ai-twitter-btn-tweet')) {
        return;
      }

      // Find if this toolbar has the main composer (tweetTextarea_0)
      const mainComposer = toolbar.closest('div')?.querySelector('[data-testid="tweetTextarea_0"]');

      // Only insert in the main home composer (not in replies)
      if (mainComposer) {
        const isInMainTimeline = !toolbar.closest('[role="dialog"]');

        if (isInMainTimeline) {
          const buttonList = toolbar.querySelector('[data-testid="ScrollSnap-List"]');

          if (buttonList && !buttonList.querySelector('.ai-twitter-btn-tweet')) {

            insertTweetButton(buttonList, toolbar);
          }
        }
      }
    });
  }

  function checkForReplyBoxes() {
    // Find all toolbars
    const toolbars = document.querySelectorAll('[data-testid="toolBar"]');

    toolbars.forEach(toolbar => {
      // Check if it already has the AI button
      if (toolbar.querySelector('.ai-twitter-btn-reply')) {
        return;
      }

      // Find the button list inside the toolbar
      const buttonList = toolbar.querySelector('[data-testid="ScrollSnap-List"]');

      if (buttonList) {

        insertReplyButton(buttonList, toolbar);
      }
    });
  }

  function insertTweetButton(buttonList, toolbar) {

    // Create container with the same structure as the other buttons
    const buttonWrapper = document.createElement('div');
    buttonWrapper.setAttribute('role', 'presentation');
    buttonWrapper.className = 'css-175oi2r r-14tvyh0 r-cpa5s6';

    const btn = document.createElement('button');
    btn.className = 'ai-twitter-btn-tweet css-175oi2r r-sdzlij r-1phboty r-rs99b7 r-lrvibr r-2yi16 r-1qi8awa r-1loqt21 r-o7ynqc r-6416eg r-1ny4l3l';
    btn.setAttribute('aria-label', 'Generate with AI');
    btn.setAttribute('role', 'button');
    btn.setAttribute('type', 'button');
    btn.style.cssText = 'background-color: rgba(0, 0, 0, 0); border-color: rgba(0, 0, 0, 0);';

    btn.innerHTML = `
      <div dir="ltr" class="css-146c3p1 r-bcqeeo r-qvutc0 r-37j5jr r-q4m81j r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-18u37iz r-16y2uox r-1777fci" style="color: rgb(29, 155, 240);">
        <div class="ai-avatar" style="width: 20px; height: 20px; font-size: 10px; background: rgb(29, 155, 240);">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <span class="css-1jxf684 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3 r-a023e6 r-rjixqe"></span>
      </div>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent multiple dialogs
      if (document.querySelector('.ai-twitter-dialog')) {

        return;
      }

      // Find the associated textarea
      const textarea = toolbar.closest('[data-testid="toolBar"]')?.parentElement?.parentElement?.querySelector('[data-testid="tweetTextarea_0"]');
      if (textarea) {
        handleCreateTweet(textarea, btn);
      }
    });

    buttonWrapper.appendChild(btn);
    buttonList.appendChild(buttonWrapper);
    twitterButtons.add(btn);

  }

  function insertReplyButton(buttonList, toolbar) {

    // Create container with the same structure as the other buttons
    const buttonWrapper = document.createElement('div');
    buttonWrapper.setAttribute('role', 'presentation');
    buttonWrapper.className = 'css-175oi2r r-14tvyh0 r-cpa5s6';

    const btn = document.createElement('button');
    btn.className = 'ai-twitter-btn-reply css-175oi2r r-sdzlij r-1phboty r-rs99b7 r-lrvibr r-2yi16 r-1qi8awa r-1loqt21 r-o7ynqc r-6416eg r-1ny4l3l';
    btn.setAttribute('aria-label', 'AI Response');
    btn.setAttribute('role', 'button');
    btn.setAttribute('type', 'button');
    btn.style.cssText = 'background-color: rgba(0, 0, 0, 0); border-color: rgba(0, 0, 0, 0);';

    btn.innerHTML = `
      <div dir="ltr" class="css-146c3p1 r-bcqeeo r-qvutc0 r-37j5jr r-q4m81j r-a023e6 r-rjixqe r-b88u0q r-1awozwy r-6koalj r-18u37iz r-16y2uox r-1777fci" style="color: rgb(29, 155, 240);">
        <div class="ai-avatar" style="width: 20px; height: 20px; font-size: 10px; background: rgb(29, 155, 240);">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <span class="css-1jxf684 r-dnmrzs r-1udh08x r-1udbk01 r-3s2u2q r-bcqeeo r-1ttztb7 r-qvutc0 r-poiln3 r-a023e6 r-rjixqe"></span>
      </div>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent multiple dialogs
      if (document.querySelector('.ai-twitter-dialog')) {

        return;
      }

      // Find the tweet content to provide context
      const toolbarElement = toolbar.closest('[data-testid="toolBar"]');

      // Try to extract context from the tweet
      let tweetContext = null;
      try {
        // Find the closest tweet container
        const tweetArticle = toolbarElement?.closest('article');

        if (tweetArticle) {
          const tweetText = tweetArticle.querySelector('[data-testid="tweetText"]');

          if (tweetText) {
            tweetContext = tweetText.innerText || tweetText.textContent;

          }
        }
      } catch (err) {

      }

      // Create dialog directly

      const dialog = createTweetDialog(tweetContext, btn);

      document.body.appendChild(dialog);

      // Check that it is in the DOM
      setTimeout(() => {
        const dialogInDom = document.querySelector('.ai-twitter-dialog');

      }, 100);
    });

    buttonWrapper.appendChild(btn);
    buttonList.appendChild(buttonWrapper);
    twitterButtons.add(btn);

  }

  async function handleCreateTweet(composer, buttonElement) {

    // Create dialog for creating tweet
    const dialog = createTweetDialog(null, buttonElement);
    document.body.appendChild(dialog);
  }

  async function handleReplyToTweet(replyBox, buttonElement) {



    // Extract the context of the original tweet
    const tweetContent = extractTweetContent(replyBox);

    if (!tweetContent) {

      // Do not show alert, create empty dialog

    }

    // Create dialog for replying

    const dialog = createTweetDialog(tweetContent, buttonElement);

    document.body.appendChild(dialog);

  }

  function extractTweetContent(replyBox) {
    // Try to extract the parent tweet content
    const tweetContainer = replyBox.closest('[data-testid="tweet"]') || 
                          replyBox.closest('article');

    if (tweetContainer) {
      const tweetText = tweetContainer.querySelector('[data-testid="tweetText"]');
      if (tweetText) {
        return tweetText.innerText || tweetText.textContent;
      }
    }

    // Search in the timeline
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

    // Position the dialog
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const dialogWidth = 520;
      const dialogHeight = 600;

      let left = rect.right + 20;
      let top = rect.top + window.scrollY;

      // Adjust if it goes off screen
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
        <div class="title">${isReply ? 'AI Response' : 'Create Tweet'}</div>
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
          <div class="ai-twitter-context-label">📌 Original tweet:</div>
          <div class="ai-twitter-context-content">${tweetContext.substring(0, 200)}${tweetContext.length > 200 ? '...' : ''}</div>
        </div>
        ` : ''}

        <div class="ai-twitter-input-section">
          <textarea
            class="ai-twitter-textarea"
            placeholder="${isReply ? 'How do you want to respond?' : 'What do you want to tweet?'}"
            rows="4"
          ></textarea>
        </div>

        <div class="ai-twitter-actions">
          ${isReply ? `
          <button class="ai-twitter-chip" data-tone="support">
            <span class="emoji">👍</span>Support
          </button>
          <button class="ai-twitter-chip" data-tone="funny">
            <span class="emoji">😄</span>Funny
          </button>
          <button class="ai-twitter-chip" data-tone="question">
            <span class="emoji">❓</span>Ask
          </button>
          <button class="ai-twitter-chip" data-tone="disagree">
            <span class="emoji">🤔</span>Disagree
          </button>
          ` : `
          <button class="ai-twitter-chip" data-tone="informative">
            <svg class="doc" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6"/><path d="M8 12h8M8 16h8"/></svg>Informative
          </button>
          <button class="ai-twitter-chip" data-tone="casual">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Casual
          </button>
          <button class="ai-twitter-chip" data-tone="professional">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zm2.92 2.33h-.5v-.5l9.9-9.9.5.5-9.9 9.9zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75 1.13-1.13z"/></svg>Professional
          </button>
          <button class="ai-twitter-chip" data-tone="viral">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>Viral
          </button>
          `}
          <div class="spacer"></div>
          <div class="ai-twitter-lang">
            <svg class="translate" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h9"/><path d="M8 5s.3 5-4 9"/><path d="M12 9h-8"/><path d="M14 19l4-10 4 10"/><path d="M15.5 15h5"/></svg>
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
            <span>Generated tweet</span>
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
              Insert
            </button>
            <button class="ai-twitter-copy-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              Copy
            </button>
            <button class="ai-twitter-regenerate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Regenerate
            </button>
          </div>
        </div>
      </div>

      <div class="ai-twitter-footer">
        <button class="ai-twitter-generate-btn" style="background-color: #ffc107;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          Generate
        </button>
      </div>
    `;

    // Make the dialog draggable
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

    // Select tone
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedTone = chip.dataset.tone;
      });
    });

    // Generate tweet
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
        
        // Update character counter
        updateCharCount(responseContent, charCount);
        
        responseSection.style.display = 'block';
        userInput.value = '';
      } catch (error) {
        alert('Error generating the tweet: ' + error.message);
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

    // Copy button
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
            Copied
          `;
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
        });
      });
    }

    // Regenerate button
    const regenerateBtn = dialog.querySelector('.ai-twitter-regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        const userContent = userInput.value.trim() || 'Generate an interesting tweet';
        
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
          alert('Error regenerating: ' + error.message);
        } finally {
          regenerateBtn.disabled = false;
          regenerateBtn.innerHTML = originalHTML;
        }
      });
    }

    // Insert button
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
      support: 'supporting and agreeing with the tweet',
      funny: 'being funny',
      question: 'asking a relevant question',
      disagree: 'expressing disagreement respectfully',
      // Para tweets nuevos
      informative: 'informativo y educativo',
      casual: 'casual y relajado',
      professional: 'profesional y formal',
      viral: 'eye-catching and with viral potential'
    };

    const languageNames = {
      es: 'español',
      en: 'inglés',
      fr: 'francés',
      de: 'alemán'
    };

    if (originalTweet) {
      // It is a response
      prompt = `Original tweet:
"${originalTweet}"

Generate a response ${tone ? toneDescriptions[tone] : 'appropriate'} based on these instructions:
${userContent}

Language: ${languageNames[language] || 'Spanish'}

IMPORTANT:
- Maximum 280 characters
- Tone ${tone ? toneDescriptions[tone] : 'natural and conversational'}
- DO NOT use excessive hashtags
- Be concise and direct
- Respond to the tweet directly`;
    } else {
      // It is a new tweet
      prompt = `Generate a tweet ${tone ? toneDescriptions[tone] : 'interesting'} about:
${userContent}

Language: ${languageNames[language] || 'Spanish'}

IMPORTANT:
- Maximum 280 characters
- Tone ${tone ? toneDescriptions[tone] : 'natural and attractive'}
- Use 1-2 relevant hashtags
- Be concise and catchy
- Generate engagement`;
    }

    const response = await AIModule.aiAnswer(prompt);
    return response;
  }

  function insertTextIntoTwitter(text) {
    // Find the active Twitter textarea
    const activeTextarea = document.querySelector('[data-testid="tweetTextarea_0"]');
    
    if (activeTextarea) {
      // Focus the textarea
      activeTextarea.focus();
      
      // Method 1: Use execCommand
      document.execCommand('insertText', false, text);
      
      // Method 2: If it doesn't work, insert directly
      if (!activeTextarea.textContent.includes(text.substring(0, 20))) {
        activeTextarea.textContent = text;
      }
      
      // Trigger events so Twitter detects the change
      activeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
      activeTextarea.dispatchEvent(new Event('change', { bubbles: true }));

    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        alert('Text copied to clipboard. Paste it on Twitter (Ctrl+V).');
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init
  };
})();
// Creado por David Montero Crespo para WriteBee

const DialogModule = (function() {
  const pinnedDialogs = [];

  function adjustDialogPosition(dialog, initialLeft, initialTop) {
    const rect = dialog.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    // initialLeft/initialTop are ABSOLUTE page coordinates
    // rect.left/rect.top are VIEWPORT coordinates
    // To compare, we need to convert everything to viewport coordinates

    let left = initialLeft;
    let top = initialTop;

    // Convert initial absolute position to viewport for comparisons
    const leftInViewport = initialLeft - scrollX;
    const topInViewport = initialTop - scrollY;

    let adjustedLeft = initialLeft;
    let adjustedTop = initialTop;

    // Adjust if it goes off the right side
    if (leftInViewport + rect.width > viewportWidth) {
      adjustedLeft = viewportWidth - rect.width - 10 + scrollX;
    }

    // Adjust if it goes off the left side
    if (leftInViewport < 10) {
      adjustedLeft = 10 + scrollX;
    }

    // Adjust if it goes off the bottom
    if (topInViewport + rect.height > viewportHeight) {
      adjustedTop = viewportHeight - rect.height - 10 + scrollY;
    }

    // Adjust if it goes off the top
    if (topInViewport < 10) {
      adjustedTop = 10 + scrollY;
    }

    dialog.style.left = adjustedLeft + 'px';
    dialog.style.top = adjustedTop + 'px';
  }

  function createDialog(action, content, selectedText, toolbarRect) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel';
    dialog.dataset.pinned = 'false';
    dialog.dataset.action = action;

    let initialLeft, initialTop;

    if (toolbarRect) {
      // toolbarRect comes with viewport coordinates (relative to the visible window)
      // Since the dialog uses position: absolute, we need absolute page coordinates
      // We add scroll to convert viewport → page
      initialLeft = toolbarRect.left + window.scrollX;
      initialTop = toolbarRect.bottom + window.scrollY + 10;

      dialog.style.left = initialLeft + 'px';
      dialog.style.top = initialTop + 'px';
    } else {
      dialog.style.left = '50%';
      dialog.style.top = '50%';
      dialog.style.transform = 'translate(-50%, -50%)';
    }

    const actionTitle = getActionTitle(action);

    // Add language selector (always present, but hidden if not translating)
    const languageSelector = `
      <select class="ai-lang-selector" aria-label="Select language" style="display: ${action === 'translate' ? 'block' : 'none'}">
        <option value="es">Español</option>
        <option value="en">English</option>
        <option value="fr">Français</option>
        <option value="de">Deutsch</option>
        <option value="it">Italiano</option>
        <option value="pt">Português</option>
        <option value="ja">日本語</option>
        <option value="zh">中文</option>
      </select>
    `;

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="title">${actionTitle}</div>
        <div style="position: relative;">
          <button class="ai-iconbtn mode-dropdown-btn" aria-label="Open options" title="Change mode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </button>
          <div class="ai-mode-dropdown">
            <div class="ai-mode-dropdown-item ${action === 'summarize' ? 'active' : ''}" data-mode="summarize">
              <span class="icon"><svg class="doc" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6"/><path d="M8 12h8M8 16h8"/></svg></span>
              Summarize
            </div>
            <div class="ai-mode-dropdown-item ${action === 'translate' ? 'active' : ''}" data-mode="translate">
              <span class="icon"><svg class="translate" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h9"/><path d="M8 5s.3 5-4 9"/><path d="M12 9h-8"/><path d="M14 19l4-10 4 10"/><path d="M15.5 15h5"/></svg></span>
              Translate
            </div>
            <div class="ai-mode-dropdown-item ${action === 'explain' ? 'active' : ''}" data-mode="explain">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
              Explain
            </div>
            <div class="ai-mode-dropdown-item ${action === 'rewrite' ? 'active' : ''}" data-mode="rewrite">
              <span class="icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zm2.92 2.33h-.5v-.5l9.9-9.9.5.5-9.9 9.9zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75 1.13-1.13z"/></svg></span>
              Rewrite
            </div>
            <div class="ai-mode-dropdown-item ${action === 'expand' ? 'active' : ''}" data-mode="expand">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg></span>
              Expand
            </div>
            <div class="ai-mode-dropdown-item ${action === 'answer' ? 'active' : ''}" data-mode="answer">
              <span class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></span>
              Answer
            </div>
          </div>
        </div>
        <div class="spacer"></div>
        ${languageSelector}
        <button class="ai-iconbtn pin-btn" aria-label="Pin" title="Pin dialog">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 3l5 5-7 7-4 1 1-4 7-7zM2 22l6-6"/>
          </svg>
        </button>
        <button class="ai-iconbtn close-panel" aria-label="Close" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        <div class="ai-preview">${selectedText}</div>
        <div class="ai-answer">${content}</div>
        <div class="ai-chat-history" style="display: none;"></div>
      </div>

      <div class="ai-actions">
        <div class="left">Ask follow-up</div>
        <div class="right">
          <button class="ai-iconbtn copy-btn" aria-label="Copy" title="Copy to clipboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
          </button>
          <button class="ai-iconbtn regenerate-btn" aria-label="Regenerate" title="Regenerate response">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
          <button class="ai-iconbtn edit-btn" aria-label="Edit response" title="Edit response">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="ai-iconbtn speak-btn" aria-label="Speak" title="Read aloud">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
            </svg>
          </button>
          <button class="ai-iconbtn open-chat-btn" aria-label="Continue in chat" title="Continue in chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M9 10h6M9 14h6"/>
            </svg>
          </button>
          <div class="ai-avatar" title="Profile">
            <div class="eyes"><span></span><span></span></div>
          </div>
        </div>
      </div>

      <div class="ai-footer">
        <div class="ai-followup">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <input type="text" placeholder="Ask follow-up question" />
          <button class="ai-send-btn" aria-label="Send" title="Send message">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22L11 13L2 9L22 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    makeDraggable(dialog);
    setupDialogEvents(dialog, content, selectedText, action);

    // Adjust position after dialog is in the DOM (done in actions.js)
    // But save the function to call from outside
    dialog.adjustPosition = function() {
      if (toolbarRect) {
        adjustDialogPosition(dialog, initialLeft, initialTop);
      }
    };

    return dialog;
  }

  function showLoadingDialog(toolbarRect) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel';
    dialog.dataset.pinned = 'false';

    if (toolbarRect) {
      // Convert viewport coordinates to absolute page coordinates
      dialog.style.left = (toolbarRect.left + window.scrollX) + 'px';
      dialog.style.top = (toolbarRect.bottom + window.scrollY + 10) + 'px';
    } else {
      dialog.style.left = '50%';
      dialog.style.top = '50%';
      dialog.style.transform = 'translate(-50%, -50%)';
    }

    dialog.innerHTML = `<div class="ai-loading">Processing...</div>`;
    document.body.appendChild(dialog);

    // Method to update progress
    dialog.updateProgress = function(percent) {
      const loadingDiv = this.querySelector('.ai-loading');
      if (loadingDiv) {
        loadingDiv.textContent = `Processing ${percent}%`;
      }
    };

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

  function setupDialogEvents(dialog, content, selectedText, action) {
    // Mode dropdown
    const dropdownBtn = dialog.querySelector('.mode-dropdown-btn');
    const dropdown = dialog.querySelector('.ai-mode-dropdown');

    if (dropdownBtn && dropdown) {
      dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('show');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !dropdownBtn.contains(e.target)) {
          dropdown.classList.remove('show');
        }
      });

      // Change mode
      dropdown.querySelectorAll('[data-mode]').forEach(item => {
        item.addEventListener('click', async (e) => {
          e.stopPropagation();
          const newMode = item.dataset.mode;

          // Cancel previous streaming if it exists
          if (dialog._currentAbortController) {
            dialog._currentAbortController.abort();
          }

          // Update UI
          dropdown.classList.remove('show');
          dropdown.querySelectorAll('.ai-mode-dropdown-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');

          // Update title
          const titleEl = dialog.querySelector('.title');
          titleEl.textContent = getActionTitle(newMode);

          // Update action in dataset
          dialog.dataset.action = newMode;

          // Show/hide language selector
          const langSelector = dialog.querySelector('.ai-lang-selector');
          if (langSelector) {
            langSelector.style.display = newMode === 'translate' ? 'block' : 'none';
          }

          // Execute new action with streaming
          const answerDiv = dialog.querySelector('.ai-answer');

          // Create typing indicator
          answerDiv.innerHTML = `
            <div class="ai-typing-indicator">
              <span></span><span></span><span></span>
            </div>
          `;

          // Create stop button
          const header = dialog.querySelector('.ai-result-header');
          let stopBtn = header.querySelector('.ai-stop-btn');

          // Remove previous button if it exists
          if (stopBtn) {
            stopBtn.remove();
          }

          stopBtn = document.createElement('button');
          stopBtn.className = 'ai-stop-btn';
          stopBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
            Stop
          `;

          const spacer = header.querySelector('.spacer');
          if (spacer) {
            spacer.insertAdjacentElement('afterend', stopBtn);
          }

          // AbortController to cancel streaming
          const abortController = new AbortController();
          dialog._currentAbortController = abortController;

          stopBtn.addEventListener('click', () => {
            abortController.abort();
            stopBtn.disabled = true;
            stopBtn.textContent = 'Stopped';
            dialog._currentAbortController = null;
          });

          try {
            let result = '';
            const currentLang = langSelector ? langSelector.value : 'es';

            // Callback function for streaming
            const onChunk = (chunk) => {
              if (answerDiv) {
                MarkdownRenderer.renderToElement(answerDiv, chunk);
              }
            };

            switch (newMode) {
              case 'summarize':
                result = await AIModule.aiSummarizeStream(selectedText, onChunk, abortController.signal);
                break;
              case 'translate':
                // Use aiAnswerStream with a prompt instead of Translator API
                const targetLangMap = {
                  'es': 'Spanish',
                  'en': 'English',
                  'fr': 'French',
                  'de': 'German',
                  'it': 'Italian',
                  'pt': 'Portuguese',
                  'ja': 'Japanese',
                  'zh': 'Chinese'
                };
                const targetLangName = targetLangMap[currentLang] || currentLang;
                const translatePrompt = `Translate the following text to ${targetLangName}. Provide only the translation, without additional explanations:\n\n${selectedText}`;
                result = await AIModule.aiAnswerStream(translatePrompt, onChunk, abortController.signal);
                break;
              case 'explain':
                result = await AIModule.aiExplainStream(selectedText, onChunk, abortController.signal);
                break;
              case 'rewrite':
                result = await AIModule.aiRewriteStream(selectedText, onChunk, abortController.signal);
                break;
              case 'expand':
                result = await AIModule.aiExpandStream(selectedText, onChunk, abortController.signal);
                break;
              case 'answer':
                result = await AIModule.aiAnswerStream(selectedText, onChunk, abortController.signal);
                break;
            }

            // Remove stop button and clear AbortController
            stopBtn.remove();
            dialog._currentAbortController = null;
          } catch (error) {
            answerDiv.textContent = error.message.includes('canceled') || error.message.includes('cancelado')
              ? 'Streaming stopped by user'
              : 'Error: ' + error.message;
            stopBtn.remove();
            dialog._currentAbortController = null;
          }
        });
      });
    }

    const closeBtn = dialog.querySelector('.close-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (dialog.dataset.pinned === 'true') {
          const index = pinnedDialogs.indexOf(dialog);
          if (index > -1) pinnedDialogs.splice(index, 1);
        }
        dialog.remove();
      });
    }

    const pinBtn = dialog.querySelector('.pin-btn');
    if (pinBtn) {
      pinBtn.addEventListener('click', () => {
        if (dialog.dataset.pinned === 'false') {
          dialog.dataset.pinned = 'true';
          pinnedDialogs.push(dialog);
          pinBtn.style.color = '#ffd400';
        } else {
          dialog.dataset.pinned = 'false';
          const index = pinnedDialogs.indexOf(dialog);
          if (index > -1) pinnedDialogs.splice(index, 1);
          pinBtn.style.color = '';
        }
      });
    }

    const copyBtn = dialog.querySelector('.copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const answerDiv = dialog.querySelector('.ai-answer');
        const textToCopy = answerDiv.textContent || content;
        navigator.clipboard.writeText(textToCopy);

        // Visual feedback
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span style="font-size: 0.9rem;">✓</span>';
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
      });
    }

    // Handle language change in translation
    const langSelector = dialog.querySelector('.ai-lang-selector');
    if (langSelector) {
      langSelector.addEventListener('change', async (e) => {
        const newLang = e.target.value;
        const answerDiv = dialog.querySelector('.ai-answer');

        // Show typing indicator
        answerDiv.innerHTML = `
          <div class="ai-typing-indicator">
            <span></span><span></span><span></span>
          </div>
        `;

        try {
          // Use aiAnswerStream with a prompt instead of Translator API
          const targetLangMap = {
            'es': 'Spanish',
            'en': 'English',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ja': 'Japanese',
            'zh': 'Chinese'
          };
          const targetLangName = targetLangMap[newLang] || newLang;
          const translatePrompt = `Translate the following text to ${targetLangName}. Provide only the translation, without additional explanations:\n\n${selectedText}`;
          
          const onChunk = (chunk) => {
            if (answerDiv) {
              MarkdownRenderer.renderToElement(answerDiv, chunk);
            }
          };
          
          const result = await AIModule.aiAnswerStream(translatePrompt, onChunk);
        } catch (error) {
          answerDiv.textContent = 'Error: ' + error.message;
        }
      });
    }

    // Regenerate Button
    const regenerateBtn = dialog.querySelector('.regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        const currentAction = dialog.dataset.action;
        const answerDiv = dialog.querySelector('.ai-answer');
        const currentLang = langSelector ? langSelector.value : 'es';

        // Show typing indicator
        answerDiv.innerHTML = `
          <div class="ai-typing-indicator">
            <span></span><span></span><span></span>
          </div>
        `;

        // Streaming callback
        const onChunk = (chunk) => {
          if (answerDiv) {
            MarkdownRenderer.renderToElement(answerDiv, chunk);
          }
        };

        try {
          let result = '';
          switch (currentAction) {
            case 'summarize':
              result = await AIModule.aiSummarizeStream(selectedText, onChunk);
              break;
            case 'translate':
              // Use aiAnswerStream with a prompt instead of Translator API
              const targetLangMap = {
                'es': 'Spanish',
                'en': 'English',
                'fr': 'French',
                'de': 'German',
                'it': 'Italian',
                'pt': 'Portuguese',
                'ja': 'Japanese',
                'zh': 'Chinese'
              };
              const targetLangName = targetLangMap[currentLang] || currentLang;
              const translatePrompt = `Translate the following text to ${targetLangName}. Provide only the translation, without additional explanations:\n\n${selectedText}`;
              result = await AIModule.aiAnswerStream(translatePrompt, onChunk);
              break;
            case 'explain':
              result = await AIModule.aiExplainStream(selectedText, onChunk);
              break;
            case 'rewrite':
              result = await AIModule.aiRewriteStream(selectedText, onChunk);
              break;
            case 'expand':
              result = await AIModule.aiExpandStream(selectedText, onChunk);
              break;
            case 'answer':
              result = await AIModule.aiAnswerStream(selectedText, onChunk);
              break;
          }
        } catch (error) {
          answerDiv.textContent = 'Error: ' + error.message;
        }
      });
    }

    // Edit Button
    const editBtn = dialog.querySelector('.edit-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const answerDiv = dialog.querySelector('.ai-answer');
        const currentText = answerDiv.textContent;

        // Convert to editable textarea
        const textarea = document.createElement('textarea');
        textarea.value = currentText;
        textarea.style.width = '100%';
        textarea.style.minHeight = '100px';
        textarea.style.background = '#1f1f23';
        textarea.style.color = '#eaeaf0';
        textarea.style.border = '1px solid #3a3a40';
        textarea.style.borderRadius = '6px';
        textarea.style.padding = '12px';
        textarea.style.fontFamily = 'inherit';
        textarea.style.fontSize = '15px';
        textarea.style.lineHeight = '1.5';
        textarea.style.resize = 'vertical';
        textarea.style.outline = 'none';

        answerDiv.innerHTML = '';
        answerDiv.appendChild(textarea);
        textarea.focus();

        // Save on blur
        textarea.addEventListener('blur', () => {
          answerDiv.textContent = textarea.value;
        });
      });
    }

    // Speak Button
    const speakBtn = dialog.querySelector('.speak-btn');
    if (speakBtn) {
      let isSpeaking = false;
      let utterance = null;

      speakBtn.addEventListener('click', () => {
        const answerDiv = dialog.querySelector('.ai-answer');
        const text = answerDiv.textContent;

        if (!isSpeaking) {
          // Start speech synthesis
          if ('speechSynthesis' in window) {
            utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'es-ES';
            utterance.rate = 1;
            utterance.pitch = 1;

            utterance.onend = () => {
              isSpeaking = false;
              speakBtn.style.color = '';
            };

            window.speechSynthesis.speak(utterance);
            isSpeaking = true;
            speakBtn.style.color = '#ffd400';
          } else {
            alert('Your browser does not support speech synthesis');
          }
        } else {
          // Stop speech synthesis
          window.speechSynthesis.cancel();
          isSpeaking = false;
          speakBtn.style.color = '';
        }
      });
    }

    // "Continue in chat" Button
    const openChatBtn = dialog.querySelector('.open-chat-btn');

    if (openChatBtn) {
      openChatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Get current dialog response
        const answerDiv = dialog.querySelector('.ai-answer');
        let currentAnswer = '';

        if (answerDiv) {
          // First try to get the original markdown
          if (answerDiv.dataset.markdown) {
            currentAnswer = answerDiv.dataset.markdown;
          }
          // If not, get the text (excluding typing indicator)
          else {
            const typingIndicator = answerDiv.querySelector('.ai-typing-indicator');
            if (typingIndicator) {
              typingIndicator.remove();
            }
            currentAnswer = answerDiv.textContent.trim();
          }
        }

        const currentAction = dialog.dataset.action;

        // Open side panel and send complete data
        try {
          chrome.runtime.sendMessage({
            action: 'openSidePanel',
            data: {
              selectedText: selectedText,
              currentAnswer: currentAnswer,
              action: currentAction
            }
          }, (response) => {
            if (chrome.runtime.lastError) {
              alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue using the chat.');
              return;
            }

            if (response && response.success) {
              // Close the dialog after opening side panel
              dialog.remove();
            }
          });
        } catch (error) {
          if (error.message.includes('Extension context invalidated')) {
            alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue using the chat.');
          } else {
            alert('Error opening chat: ' + error.message);
          }
        }
      });
    }

    // Follow-up chat system
    const followupInput = dialog.querySelector('.ai-followup input');
    const sendBtn = dialog.querySelector('.ai-send-btn');
    const chatHistory = dialog.querySelector('.ai-chat-history');
    const previewDiv = dialog.querySelector('.ai-preview');
    const answerDiv = dialog.querySelector('.ai-answer');

    // Conversation history
    let conversationHistory = [
      { role: 'user', content: selectedText },
      { role: 'assistant', content: content }
    ];

    // Function to send message - Now opens side panel
    const sendMessage = async () => {
      if (!followupInput.value.trim()) return;

      const userMessage = followupInput.value.trim();
      followupInput.value = '';

      // Get current dialog response
      let currentAnswer = '';
      if (answerDiv) {
        if (answerDiv.dataset.markdown) {
          currentAnswer = answerDiv.dataset.markdown;
        } else {
          const typingIndicator = answerDiv.querySelector('.ai-typing-indicator');
          if (typingIndicator) {
            typingIndicator.remove();
          }
          currentAnswer = answerDiv.textContent.trim();
        }
      }

      const currentAction = dialog.dataset.action;

      // Open side panel with dialog context + follow-up question
      try {
        chrome.runtime.sendMessage({
          action: 'openSidePanel',
          data: {
            selectedText: selectedText,
            currentAnswer: currentAnswer,
            action: currentAction,
            followupQuestion: userMessage  // New user question
          }
        }, (response) => {
          if (chrome.runtime.lastError) {
            alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue using the chat.');
            return;
          }

          if (response && response.success) {
            // Close the dialog after opening side panel
            dialog.remove();
          }
        });
      } catch (error) {
        if (error.message.includes('Extension context invalidated')) {
          alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue using the chat.');
        } else {
          alert('Error opening chat: ' + error.message);
        }
      }
    };

    // Event listener for Enter
    if (followupInput) {
      followupInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
          await sendMessage();
        }
      });
    }

    // Event listener for send button
    if (sendBtn) {
      sendBtn.addEventListener('click', async () => {
        await sendMessage();
      });
    }
  }

  function addChatMessage(container, role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `ai-chat-message ${role}`;

    const label = document.createElement('div');
    label.className = 'ai-chat-label';
    label.textContent = role === 'user' ? 'You' : 'Assistant';

    const bubble = document.createElement('div');
    bubble.className = 'ai-chat-bubble';

    // Render markdown only for assistant messages
    if (role === 'assistant') {
      MarkdownRenderer.renderToElement(bubble, content);
    } else {
      bubble.textContent = content;
    }

    messageDiv.appendChild(label);
    messageDiv.appendChild(bubble);
    container.appendChild(messageDiv);

    return messageDiv;
  }

  function getActionTitle(action) {
    const titles = {
      'summarize': 'Summarize',
      'translate': 'Translate',
      'explain': 'Explain this',
      'rewrite': 'Rewrite',
      'expand': 'Expand',
      'answer': 'Answer this question'
    };
    return titles[action] || 'Result';
  }

  function getCurrentDialog() {
    const dialogs = document.querySelectorAll('.ai-result-panel');
    for (let dialog of dialogs) {
      if (dialog.dataset.pinned === 'false') {
        return dialog;
      }
    }
    return null;
  }

  function removeCurrentDialog() {
    const dialog = getCurrentDialog();
    if (dialog) {
      dialog.remove();
    }
  }

  /**
   * Create dialog for image processing
   */
  function createImageDialog(imageFile, action = 'describe', toolbarRect = null) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-image-dialog';
    dialog.dataset.pinned = 'true';
    dialog.dataset.action = action;

    let initialLeft, initialTop;

    if (toolbarRect) {
      initialLeft = toolbarRect.left;
      initialTop = toolbarRect.bottom + 10;
      dialog.style.left = initialLeft + 'px';
      dialog.style.top = initialTop + 'px';
    } else {
      dialog.style.left = '50%';
      dialog.style.top = '50%';
      dialog.style.transform = 'translate(-50%, -50%)';
    }

    const actionTitles = {
      describe: 'Image Description',
      summarize: 'Summarize Image',
      translate: 'Translate Text in Image',
      explain: 'Explain Image',
      alttext: 'Generate Alt Text'
    };

    const title = actionTitles[action] || 'Process Image';

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="AI Multimodal">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">${title}</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close" title="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        <div class="ai-image-preview" style="margin-bottom: 1rem; text-align: center;">
          <img src="${URL.createObjectURL(imageFile)}" alt="Image to process" style="max-width: 100%; max-height: 300px; border-radius: 8px;" />
        </div>
        <div class="ai-answer" style="min-height: 100px;">Processing image...</div>
      </div>

      <div class="ai-actions">
        <div class="left">Image processed</div>
        <div class="right">
          <button class="ai-iconbtn copy-btn" aria-label="Copy" title="Copy to clipboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
          </button>
        </div>
      </div>
    `;

    makeDraggable(dialog);
    setupImageDialogEvents(dialog, imageFile, action);

    return dialog;
  }

  /**
   * Setup events for image dialog
   */
  function setupImageDialogEvents(dialog, imageFile, action) {
    const answerDiv = dialog.querySelector('.ai-answer');
    const copyBtn = dialog.querySelector('.copy-btn');
    const closeBtn = dialog.querySelector('.close-panel');

    // Process image automatically
    (async () => {
      try {
        const result = await MultimodalModule.processImageWithAction(
          imageFile,
          action,
          '',
          (progress) => {
            answerDiv.textContent = progress;
          }
        );
        answerDiv.textContent = result;
      } catch (error) {
        answerDiv.textContent = `❌ Error: ${error.message}`;
      }
    })();

    // Copy
    copyBtn.addEventListener('click', () => {
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

    // Close
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });
  }

  /**
   * Helper function to make a dialog draggable (publicly exposed)
   */
  function enableDrag(dialog) {
    makeDraggable(dialog);
  }

  return {
    createDialog,
    showLoadingDialog,
    getCurrentDialog,
    removeCurrentDialog,
    createImageDialog,
    enableDrag
  };
})();



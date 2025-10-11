const LinkedInModule = (function() {
  let linkedinButton = null;
  let isLinkedIn = false;
  let currentContext = null; // 'comment' | 'post'

  function init() {
    // Detect if we are on LinkedIn
    isLinkedIn = window.location.hostname.includes('linkedin.com');

    if (isLinkedIn) {
      console.log('💼 LinkedIn detected, starting module...');
      observeLinkedIn();
    }
  }

  function observeLinkedIn() {
    // Observe DOM changes to detect comment and post areas
    const observer = new MutationObserver(() => {
      checkForCommentArea();
      checkForPostArea();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Check immediately
    setTimeout(() => {
      checkForCommentArea();
      checkForPostArea();
    }, 1000);
  }

  function checkForCommentArea() {
    // Only look for the main comment writing area (not existing comments)
    const commentForms = document.querySelectorAll('.comments-comment-box__form');

    console.log('💼 LinkedIn: Looking for comment forms...', commentForms.length);

    commentForms.forEach(form => {
      // Check if the button already exists in this specific form
      if (!form.querySelector('.ai-linkedin-btn-comment')) {
        console.log('💼 LinkedIn: Inserting button in form');
        insertCommentButton(form);
      }
    });
  }

  function checkForPostArea() {
    // Look for the footer of the post creation area
    const postFooter = document.querySelector('.share-creation-state__footer .share-creation-state__schedule-and-post-container');

    if (postFooter && !postFooter.querySelector('.ai-linkedin-btn-post')) {
      insertPostButton(postFooter);
    }
  }

  function insertCommentButton(commentForm) {
  console.log('💼 LinkedIn: Creating comment button...');

    const btn = document.createElement('button');
    btn.className = 'ai-linkedin-btn-comment';
  btn.setAttribute('aria-label', 'AI Reply');
    btn.setAttribute('type', 'button');
    btn.innerHTML = `
      <span class="artdeco-button__text">AI Reply</span>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent multiple dialogs
      if (document.querySelector('.ai-linkedin-dialog')) {
        console.log('💼 LinkedIn: A dialog is already open');
        return;
      }

      console.log('💼 LinkedIn: Click on comment button');
      handleCommentResponse(commentForm, btn);
    });

    // Find the button container at the bottom right
    const bottomRightContainer = commentForm.querySelector('.display-flex.justify-space-between .display-flex.align-items-center');

    console.log('💼 LinkedIn: bottomRightContainer found:', bottomRightContainer);

    if (bottomRightContainer) {
      bottomRightContainer.appendChild(btn);
      console.log('💼 LinkedIn: Button inserted successfully');
    } else {
      console.log('💼 LinkedIn: No right container found');
    }
  }

  function insertPostButton(postFooterContainer) {
    const btn = document.createElement('button');
    btn.className = 'ai-linkedin-btn-post';
  btn.setAttribute('aria-label', 'AI WriteBee');
    btn.setAttribute('type', 'button');
    btn.style.cssText = 'margin-right: 8px;';
    btn.innerHTML = `
      <span class="artdeco-button__text">AI WriteBee</span>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent multiple dialogs
      if (document.querySelector('.ai-linkedin-dialog')) {
        console.log('💼 LinkedIn: A dialog is already open');
        return;
      }

      handleCreatePost();
    });

    // Insert before the schedule (clock) button
    const scheduleBtn = postFooterContainer.querySelector('.share-creation-state__schedule-clock-btn');
    if (scheduleBtn) {
      postFooterContainer.insertBefore(btn, scheduleBtn);
    } else {
      postFooterContainer.appendChild(btn);
    }
  }

  async function handleCommentResponse(commentBox, buttonElement) {
  console.log('💬 Generating comment reply...');

    // Extract the context of the post/comment
    const postContent = extractPostContent(commentBox);
    console.log('💬 Extracted content:', postContent);

    if (!postContent) {
      console.log('❌ Could not extract content');
      alert('Could not extract post content');
      return;
    }

    // Create dialog to reply to comments
    console.log('💬 Creating dialog...');
    const dialog = createCommentDialog(postContent, buttonElement);
    console.log('💬 Dialog created:', dialog);
    document.body.appendChild(dialog);
    console.log('💬 Dialog added to body');
  }

  function handleCreatePost() {
  console.log('📝 Creating post...');

  // Create dialog to create post
  const dialog = createPostDialog();
  document.body.appendChild(dialog);
  }

  function extractPostContent(commentBox) {
    // Try to extract the content of the parent post
    const postContainer = commentBox.closest('.feed-shared-update-v2, .occludable-update');

    if (postContainer) {
      const content = postContainer.querySelector('.feed-shared-text, .break-words');
      return content ? content.innerText : 'LinkedIn post';
    }

    return 'LinkedIn post';
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
        <div class="title">AI Reply</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn pin-btn" aria-label="Pin">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 17v5M9 3l6 0M8 7l8 0M6 7c0 3 2 6 6 6s6-3 6-6"/>
          </svg>
        </button>
        <button class="ai-iconbtn close-panel" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        <div class="ai-linkedin-context">
          <div class="ai-linkedin-context-label"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> Post context:</div>
          <div class="ai-linkedin-context-content">${postContext.substring(0, 200)}${postContext.length > 200 ? '...' : ''}</div>
        </div>

        <div class="ai-linkedin-input-section">
          <textarea
            class="ai-linkedin-textarea"
            placeholder="Describe your modification"
            rows="4"
          ></textarea>
        </div>

        <div class="ai-linkedin-actions">
          <button class="ai-linkedin-chip" data-tone="support">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>Support
          </button>
          <button class="ai-linkedin-chip" data-tone="oppose">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>Oppose
          </button>
          <button class="ai-linkedin-chip" data-tone="discuss">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>Discuss
          </button>
          <button class="ai-linkedin-chip" data-tone="question">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/></svg>Question
          </button>
          <div class="spacer"></div>
          <div class="ai-linkedin-lang">
            <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg></span>
            <select class="ai-linkedin-lang-select">
              <option value="es">spanish</option>
              <option value="en">english</option>
              <option value="fr">french</option>
              <option value="de">german</option>
            </select>
          </div>
        </div>

        <div class="ai-linkedin-response" style="display: none;">
          <div class="ai-linkedin-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Generated reply</span>
          </div>
          <div class="ai-linkedin-response-content" contenteditable="true"></div>
          <div class="ai-linkedin-response-actions">
            <button class="ai-linkedin-insert-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Insert
            </button>
            <button class="ai-linkedin-copy-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              Copy
            </button>
            <button class="ai-linkedin-regenerate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Regenerate
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
          Generate
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
        <div class="title">AI Post</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-linkedin-toolbar">
        <div class="ai-linkedin-dropdown">
          <button class="ai-linkedin-dropdown-trigger">
            <span class="selected-template">Select Template</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          <div class="ai-linkedin-dropdown-menu">
            <button class="ai-linkedin-template-item" data-template="insights">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2v8h8"/><path d="M13 10l9-9"/><circle cx="12" cy="12" r="10"/></svg></div>
              <div class="template-name">Share professional insights</div>
            </button>
            <button class="ai-linkedin-template-item" data-template="milestone">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 17l4-4 4 4"/><path d="M12 13V7"/></svg></div>
              <div class="template-name">Celebrate a milestone</div>
            </button>
            <button class="ai-linkedin-template-item" data-template="learning">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg></div>
              <div class="template-name">Share learnings</div>
            </button>
            <button class="ai-linkedin-template-item" data-template="question">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/></svg></div>
              <div class="template-name">Ask the community</div>
            </button>
            <button class="ai-linkedin-template-item" data-template="announcement">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3v4"/><path d="M8 3v4"/></svg></div>
              <div class="template-name">Announce something important</div>
            </button>
            <button class="ai-linkedin-template-item" data-template="tips">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
              <div class="template-name">Share useful tips</div>
            </button>
          </div>
        </div>
      </div>

      <div class="ai-result-body">
        <div class="ai-linkedin-input-section">
          <textarea
            class="ai-linkedin-textarea ai-linkedin-post-textarea"
            placeholder="Describe your post idea"
            rows="6"
          ></textarea>
        </div>

        <div class="ai-linkedin-response" style="display: none;">
          <div class="ai-linkedin-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span>Generated post</span>
          </div>
          <div class="ai-linkedin-response-content" contenteditable="true"></div>
          <div class="ai-linkedin-response-actions">
            <button class="ai-linkedin-insert-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Insert
            </button>
            <button class="ai-linkedin-copy-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              Copy
            </button>
            <button class="ai-linkedin-regenerate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Regenerate
            </button>
          </div>
        </div>
      </div>

      <div class="ai-linkedin-footer">
        <div class="ai-linkedin-lang">
          <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg></span>
          <select class="ai-linkedin-lang-select">
            <option value="en">english</option>
            <option value="es">spanish</option>
            <option value="fr">french</option>
            <option value="de">german</option>
          </select>
        </div>
        <button class="ai-linkedin-generate-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13"/>
            <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
          Generate
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

    // Close
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

    // Tone chips
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        chips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedTone = chip.dataset.tone;
      });
    });

    // Generate
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
        Generating...
      `;

      try {
        const response = await generateCommentResponse(postContext, userInput, selectedTone, language);

        MarkdownRenderer.renderToElement(responseContent, response);
        responseSection.style.display = 'block';
        textarea.value = '';

        // Auto-scroll to generated response
        setTimeout(() => {
          responseSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          // Also focus the editable content so user can edit immediately
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

        // Find the comment text editor
        const commentForm = document.querySelector('.comments-comment-box__form');
        if (commentForm) {
          const editor = commentForm.querySelector('.ql-editor');
          if (editor) {
            editor.innerHTML = `<p>${text}</p>`;
            editor.focus();

            // Visual feedback
            const originalHTML = insertBtn.innerHTML;
            insertBtn.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Inserted
            `;
            setTimeout(() => {
              insertBtn.innerHTML = originalHTML;
            }, 2000);

            // Close dialog after inserting
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
            Copied
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

    // Close
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

    // Enable generate when there is text or template selected
    textarea.addEventListener('input', () => {
      generateBtn.disabled = false;
    });

    // Generate
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
        Generating...
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

        // Find the LinkedIn post text editor
        const shareBox = document.querySelector('.share-creation-state__text-editor');
        if (shareBox) {
          const editor = shareBox.querySelector('.ql-editor');
          if (editor) {
            editor.innerHTML = `<p>${text}</p>`;
            editor.focus();

            // Visual feedback
            const originalHTML = insertBtn.innerHTML;
            insertBtn.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Inserted
            `;
            setTimeout(() => {
              insertBtn.innerHTML = originalHTML;
            }, 2000);

            // Close dialog after inserting
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
            Copied
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
        toneInstruction = 'Write a supportive and positive comment.';
        break;
      case 'oppose':
        toneInstruction = 'Write a polite comment that expresses disagreement.';
        break;
      case 'discuss':
        toneInstruction = 'Write a comment that invites constructive discussion.';
        break;
      case 'question':
        toneInstruction = 'Write a comment with relevant questions.';
        break;
      default:
        toneInstruction = 'Write a professional and thoughtful comment.';
    }

    const prompt = `LinkedIn post context:
${postContext}

User instructions:
${userInput || 'Generate an appropriate comment'}

${toneInstruction}

Language: ${language}

Generate a professional LinkedIn comment that is authentic, concise (2-4 sentences), and appropriate for a professional network. Avoid being too formal or robotic.`;

    const response = await AIModule.aiAnswer(prompt);
    return response;
  }

  async function generatePostContent(userInput, template, language) {
    let templateInstruction = '';

    switch (template) {
      case 'insights':
        templateInstruction = 'Structure: Main insight → Brief explanation → Conclusion/Call to action';
        break;
      case 'milestone':
        templateInstruction = 'Structure: Achievement/Milestone → Context/Path → Acknowledgments → Next step';
        break;
      case 'learning':
        templateInstruction = 'Structure: Key learning → Story/Example → Applicable lessons';
        break;
      case 'question':
        templateInstruction = 'Structure: Brief context → Clear question → Why is it important?';
        break;
      case 'announcement':
        templateInstruction = 'Structure: Main announcement → Key details → Impact/Value';
        break;
      case 'tips':
        templateInstruction = 'Structure: Introduction → List of tips (3-5) → Conclusion';
        break;
      default:
        templateInstruction = 'Clear and professional structure';
    }

    const prompt = `Post topic/idea:
${userInput}

Template: ${template || 'general'}
${templateInstruction}

Language: ${language}

Generate a professional LinkedIn post that is:
- Authentic and personal
- Well-structured with short paragraphs
- Includes subtle emojis where appropriate (max 2-3)
- Ends with a question or call to interaction
- Length: 150-300 words

Do not use excessive hashtags, max 3-5 at the end if relevant.`;

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

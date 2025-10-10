const OutlookModule = (function() {
  let outlookButton = null;
  let isOutlook = false;

  console.log('🔧 OutlookModule loading...');

  function init() {
  // Detect if we are in Outlook
    isOutlook = window.location.hostname.includes('outlook.live.com') || 
                window.location.hostname.includes('outlook.office.com') ||
                window.location.hostname.includes('outlook.office365.com');
    
    if (isOutlook) {
  console.log('📧 Outlook detected, starting module...');
      observeOutlook();
    } else {
  console.log('ℹ️ Not in Outlook, module on standby');
    }
  }

  function observeOutlook() {
  // Observe DOM changes to detect when an email is opened
    const observer = new MutationObserver(() => {
      checkForEmailView();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

  // Check immediately
    setTimeout(checkForEmailView, 1000);
  }

  function checkForEmailView() {
  // Specifically look for the Outlook compose/reply editor
  // Only show the button when composing an email
    const composeEditor = document.querySelector('[role="textbox"][aria-label*="Cuerpo"]') ||
                          document.querySelector('[role="textbox"][contenteditable="true"]') ||
                          document.querySelector('.elementToProof[contenteditable="true"]') ||
                          document.querySelector('div[contenteditable="true"][aria-label]');
    
    if (composeEditor && !outlookButton) {
  console.log('✍️ Compose editor detected in Outlook');
      insertAIButton(composeEditor);
    } else if (!composeEditor && outlookButton) {
  // If the editor is no longer active, remove the button
      removeAIButton();
    }
  }

  function insertAIButton(composeEditor) {
  // Find the area where the compose editor is
    const editorContainer = composeEditor.closest('[role="main"]') || 
                           composeEditor.closest('.customScrollBar') ||
                           composeEditor.parentElement;
    
    if (!editorContainer) {
  console.log('⚠️ Editor container not found');
      return;
    }

  // Find the editor toolbar (formatting, attach, etc. buttons)
    const toolbar = editorContainer.querySelector('[role="toolbar"]') ||
                    editorContainer.querySelector('[data-app-section="ComposeToolbar"]') ||
                    editorContainer.querySelector('.ms-FocusZone');
    
    if (toolbar) {
  // Create AI button for the toolbar
      outlookButton = document.createElement('button');
      outlookButton.className = 'ai-outlook-button';
      outlookButton.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          <path d="M8 10h8M8 14h4"/>
        </svg>
        <span>AI WriteBee</span>
      `;

      outlookButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAIAssistant(composeEditor);
      });

      toolbar.appendChild(outlookButton);
  console.log('✅ AI button inserted in compose toolbar');
    } else {
  // If no toolbar, create floating button near the editor
      createFloatingButton(editorContainer, composeEditor);
    }
  }

  function createFloatingButton(editorContainer, composeEditor) {
  // Create a floating button near the compose editor
    outlookButton = document.createElement('div');
    outlookButton.className = 'ai-outlook-floating-button';
    outlookButton.innerHTML = `
      <button class="ai-outlook-button-float">
        <div class="ai-avatar" style="width: 20px; height: 20px; font-size: 10px;">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <span>AI WriteBee</span>
      </button>
    `;

    outlookButton.querySelector('button').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleAIAssistant(composeEditor);
    });

    // Insertar antes del editor
    editorContainer.insertBefore(outlookButton, composeEditor);
  console.log('✅ Floating AI button inserted near the editor');
  }

  function removeAIButton() {
    if (outlookButton) {
      outlookButton.remove();
      outlookButton = null;
    }
  }

  async function handleAIAssistant(composeEditor) {
  console.log('🤖 AI WriteBee AI activated for Outlook...');

  // Try to extract the context of the original email (if replying)
    let originalEmailContent = null;
    
  // Find the content of the original email in the reply window
    const originalMessage = document.querySelector('[aria-label*="Mensaje original"]') ||
                           document.querySelector('.rps_b91e') ||
                           document.querySelector('[data-app-section="ReadingPaneBody"]');
    
    if (originalMessage) {
      originalEmailContent = originalMessage.innerText || originalMessage.textContent;
  console.log('📧 Original email context found');
    }

  // Create the assistant dialog
    const dialog = createOutlookDialog(composeEditor, originalEmailContent);
    document.body.appendChild(dialog);

  // If there is an original email, generate summary automatically
    if (originalEmailContent) {
      const summaryDiv = dialog.querySelector('.ai-outlook-summary-content');
  summaryDiv.innerHTML = '<div style="color: #a5a7b1; text-align: center; padding: 20px;">Analyzing context...</div>';

      try {
        const summary = await AIModule.aiSummarize(originalEmailContent, (percent) => {
    summaryDiv.innerHTML = `<div style="color: #a5a7b1; text-align: center; padding: 20px;">Analyzing context ${percent}%</div>`;
        });

        MarkdownRenderer.renderToElement(summaryDiv, summary);
      } catch (error) {
  summaryDiv.innerHTML = `<div style="color: #ff6b6b; padding: 12px;">Error: ${error.message}</div>`;
      }
    }
  }

  function extractEmailContent(emailContainer) {
  // Try to extract the email text in Outlook
    const contentDiv = emailContainer.querySelector('[role="document"]') || 
                       emailContainer.querySelector('.elementToProof') ||
                       emailContainer.querySelector('[data-app-section="ReadingPaneBody"]') ||
                       emailContainer.querySelector('.rps_b91e') ||
                       emailContainer.querySelector('[aria-label*="Cuerpo"]');
    
    if (contentDiv) {
      return contentDiv.innerText || contentDiv.textContent;
    }

  // If no specific selector is found, try the whole container
    return emailContainer.innerText || emailContainer.textContent;
  }

  function createOutlookDialog(composeEditor, originalEmailContent) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel';
    dialog.dataset.pinned = 'true';

  // Center on the screen
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
        <div class="title">AI WriteBee - Outlook</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close">
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
            <span>Message context</span>
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
            <span>Write with AI</span>
          </div>
          <div class="ai-followup" style="margin-bottom: 12px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <input type="text" class="ai-outlook-input" placeholder="${hasContext ? 'What do you want to include in your reply?' : 'What do you want to write?'}" />
            <button class="ai-send-btn ai-outlook-generate-btn" aria-label="Generate">
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
            <span>Generated text</span>
          </div>
          <div class="ai-outlook-response-content" contenteditable="true"></div>
          <div class="ai-outlook-response-actions">
            <button class="ai-outlook-insert-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Insert into Outlook
            </button>
            <button class="ai-outlook-copy-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              Copy
            </button>
            <button class="ai-outlook-regenerate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Regenerate
            </button>
          </div>
        </div>
      </div>
    `;

  // Make the dialog draggable
    makeDraggable(dialog);

  // Dialog events
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
  // Close button
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });

  // Generate response button
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
  alert('Error generating text: ' + error.message);
      } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalHTML;
      }
    };

    generateBtn.addEventListener('click', generateResponse);

  // Allow Enter to generate
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        generateResponse();
      }
    });

  // Copy button
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
            Copied
          `;
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
        });
      });
    }

  // Regenerate button
    const regenerateBtn = dialog.querySelector('.ai-outlook-regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
  const userContent = userInput.value.trim() || 'Generate a professional text';

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
          alert('Error regenerating: ' + error.message);
        } finally {
          regenerateBtn.disabled = false;
          regenerateBtn.innerHTML = originalHTML;
        }
      });
    }

  // Insert into Outlook button
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
  // If there is context from an original email, generate a reply
  prompt = `Original email:
${originalEmailContent}

Instructions for the reply:
${userContent}

Generate a professional and cordial reply to this email, following the user's instructions. The reply should be clear, well-structured, and appropriate for a professional email.`;
    } else {
  // If there is no context, generate text from scratch
  prompt = `Write a professional email with the following content:

${userContent}

The email should be clear, cordial, and appropriate for a professional context.`;
    }

    const response = await AIModule.aiAnswer(prompt);
    return response;
  }

  function insertTextIntoOutlookEditor(composeEditor, text) {
    if (!composeEditor) {
  // Fallback: copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
  alert('Text copied to clipboard. Paste it into the editor (Ctrl+V).');
      });
      return;
    }

  // Insert the text into the editor
    composeEditor.focus();
    
  // Method 1: Try with execCommand
    const success = document.execCommand('insertText', false, text);
    
  // Method 2: If it doesn't work, insert directly into the HTML
    if (!success || !composeEditor.innerText.includes(text.substring(0, 20))) {
      const p = document.createElement('p');
      p.textContent = text;
      composeEditor.appendChild(p);
    }
    
  // Trigger events so Outlook detects the change
    composeEditor.dispatchEvent(new Event('input', { bubbles: true }));
    composeEditor.dispatchEvent(new Event('change', { bubbles: true }));
    
  console.log('✅ Text inserted into Outlook editor');
  }

  async function handleUnreadSummary() {
  console.log('📬 Getting unread emails from Outlook...');
    
    try {
      const unreadEmails = await getUnreadEmails();
      
      if (unreadEmails.length === 0) {
  alert('No unread emails 🎉');
        return;
      }
      
  console.log(`📧 ${unreadEmails.length} unread emails found in Outlook`);
      
  // Create summary dialog
      const dialog = createUnreadSummaryDialog(unreadEmails);
      document.body.appendChild(dialog);
      
  // Generate summary
      await generateUnreadSummary(dialog, unreadEmails);
      
    } catch (error) {
      console.error('Error:', error);
  alert('Error getting unread emails: ' + error.message);
    }
  }

  async function getUnreadEmails() {
  // Find all unread emails in Outlook
  // Outlook uses different selectors depending on the version
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
        
  // Extract info from aria-label containing all the email info
  // Typical format: "Unread, [Sender], [Subject], [Date], [Snippet]"
        const parts = ariaLabel.split(',').map(p => p.trim());
        
        let sender = 'Desconocido';
        let subject = 'Sin asunto';
        let snippet = '';
        
  // Try to extract info from aria-label
        if (parts.length > 1) {
          sender = parts[1] || 'Desconocido';
          subject = parts[2] || 'Sin asunto';
          snippet = parts.slice(3).join(', ') || '';
        } else {
          // Try to extract from internal elements
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
        
  // Clean text
        sender = sender.replace(/^(No leído|Unread)[,\s]*/i, '').trim();
        
        unreadEmails.push({
          sender,
          subject,
          snippet,
          row
        });
        
  // Limit to 20 emails to avoid overload
        if (unreadEmails.length >= 20) break;
        
      } catch (error) {
  console.error('Error processing Outlook email:', error);
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
        <div class="ai-avatar" title="Unread Summary">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">Summary of ${unreadEmails.length} Unread Emails - Outlook</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close">
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
            <span>General Summary</span>
          </div>
          <div class="ai-unread-summary-content">
            <div style="color: #a5a7b1; text-align: center; padding: 40px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.5;">
                <circle cx="12" cy="12" r="10" opacity="0.3"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
                  <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </path>
              </svg>
              <div>Analyzing unread emails...</div>
            </div>
          </div>
        </div>
        
        <div class="ai-outlook-section">
          <div class="ai-outlook-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>Email List (${unreadEmails.length})</span>
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

  // Make the dialog draggable
    makeDraggable(dialog);

  // Close button
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });

    return dialog;
  }

  async function generateUnreadSummary(dialog, unreadEmails) {
    const summaryContent = dialog.querySelector('.ai-unread-summary-content');
    
    try {
      // Create the text with all emails for the summary
        let emailsText = `I have ${unreadEmails.length} unread emails in Outlook:\n\n`;
      
        unreadEmails.forEach((email, index) => {
          emailsText += `${index + 1}. From: ${email.sender}\n`;
        emailsText += `   Asunto: ${email.subject}\n`;
        if (email.snippet) {
          emailsText += `   Extracto: ${email.snippet.substring(0, 200)}\n`;
        }
        emailsText += `\n`;
      });

  const prompt = `${emailsText}

Please generate an executive summary of these unread emails. Organize the summary by:
1. Priority (urgent, important, informative)
2. Thematic categories
3. Required actions

Be concise but informative.`;

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
      summaryContent.innerHTML = `
        <div style="color: #ff6b6b; padding: 20px; text-align: center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>Error to generate summary: ${escapeHtml(error.message)}</div>
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
  
  console.log('✅ OutlookModule loaded and exported globally', publicAPI);

  return publicAPI;
})();

const GmailModule = (function() {
  let gmailButton = null;
  let isGmail = false;

  function init() {
    // Detect if we are in Gmail
    isGmail = window.location.hostname.includes('mail.google.com');
    
    if (isGmail) {

      observeGmail();
    }
  }

  function observeGmail() {
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

  async function handleUnreadSummary() {

    try {
      const unreadEmails = await getUnreadEmails();
      
      if (unreadEmails.length === 0) {
        alert('No unread emails 🎉');
        return;
      }

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
    // Find all unread emails in the current view
    const unreadRows = document.querySelectorAll('tr.zE, tr.zA');
    const unreadEmails = [];
    
    for (const row of unreadRows) {
      try {
        // Check if the email is marked as unread (has the specific class)
        const isUnread = row.classList.contains('zE') || 
                        row.querySelector('.zF') || // Unread badge
                        row.querySelector('span[email]')?.closest('tr')?.classList.contains('zE');
        
        if (!isUnread && !row.classList.contains('zE')) continue;
        
        // Extract email information
        const senderElement = row.querySelector('span[email]') || 
                             row.querySelector('.yW span') ||
                             row.querySelector('.yP');
        
        const subjectElement = row.querySelector('.bog span') || 
                              row.querySelector('[data-thread-id] span');
        
        const snippetElement = row.querySelector('.y2');
        
        const sender = senderElement?.getAttribute('email') || 
                      senderElement?.textContent?.trim() || 
                      'Unknown';
        
        const subject = subjectElement?.textContent?.trim() || 'No subject';
        const snippet = snippetElement?.textContent?.trim() || '';
        
        unreadEmails.push({
          sender,
          subject,
          snippet,
          row
        });
        
        // Limit to 20 emails to avoid overload
        if (unreadEmails.length >= 20) break;
        
      } catch (error) {
        console.error('Error processing email:', error);
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
        <div class="title">Summary of ${unreadEmails.length} Unread Emails</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close">
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
        
        <div class="ai-gmail-section">
          <div class="ai-gmail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>Email List</span>
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
    
    // Events
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => dialog.remove());
    
    // Click on each email to open it
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
      // Prepare the text of all emails
      const emailsText = unreadEmails.map((email, index) => {
        return `Email ${index + 1}:
Sender: ${email.sender}
Subject: ${email.subject}
${email.snippet ? `Content: ${email.snippet}` : ''}
---`;
      }).join('\n\n');
      
      const prompt = `Analyze the following ${unreadEmails.length} unread emails and generate an executive summary that includes:

1. **General summary**: An overview of the main topics
2. **Urgent or important emails**: Identify which ones require immediate attention
3. **Categories**: Group emails by topic or type (work, personal, notifications, etc.)
4. **Suggested actions**: Which emails should be responded to first

Unread emails:

${emailsText}

Generate a clear, concise and well-structured summary in English.`;

      // Generate summary with progress
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
      
      // Render the summary
      MarkdownRenderer.renderToElement(summaryContent, summary);
      
    } catch (error) {
      summaryContent.innerHTML = `
        <div style="color: #ff6b6b; padding: 20px; text-align: center;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 48px; height: 48px; margin: 0 auto 16px;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>Error generating summary: ${error.message}</div>
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
    // Find the container of an open email in Gmail
    const emailBody = document.querySelector('[data-message-id]');
    
    if (emailBody && !gmailButton) {

      insertAIButton(emailBody);
    } else if (!emailBody && gmailButton) {
      // If there is no longer an open email, remove the button
      removeAIButton();
    }
  }

  function insertAIButton(emailContainer) {
    // Find the Gmail toolbar (where the reply, forward buttons are, etc.)
    const toolbar = emailContainer.querySelector('[role="toolbar"]') || 
                    emailContainer.querySelector('.gU') ||
                    emailContainer.parentElement.querySelector('[role="toolbar"]');
    
    if (!toolbar) {

      return;
    }

    // Create AI button
    gmailButton = document.createElement('button');
    gmailButton.className = 'ai-gmail-button';
    gmailButton.innerHTML = `
      <div class="ai-avatar" style="width: 20px; height: 20px; font-size: 10px;">
        <div class="eyes"><span></span><span></span></div>
      </div>
      <span>AI Response</span>
    `;

    gmailButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      handleAIResponse(emailContainer);
    });

    // Insert the button in the toolbar
    toolbar.appendChild(gmailButton);

  }

  function removeAIButton() {
    if (gmailButton) {
      gmailButton.remove();
      gmailButton = null;
    }
  }

  async function handleAIResponse(emailContainer) {

    // Extract the email content immediately
    const emailContent = extractEmailContent(emailContainer);

    if (!emailContent) {
      alert('Could not extract the email content');
      return;
    }

    // Create the dialog immediately with loading state
    const dialog = createGmailDialog(emailContent, null);
    document.body.appendChild(dialog);

    // Show loading state in the summary
    const summaryDiv = dialog.querySelector('.ai-gmail-summary-content');
    summaryDiv.innerHTML = '<div style="color: #a5a7b1; text-align: center; padding: 20px;">Analyzing email...</div>';

    try {
      // Generate email summary
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

      // Render the summary
      MarkdownRenderer.renderToElement(summaryDiv, summary);

    } catch (error) {
      summaryDiv.innerHTML = `<div style="color: #ff6b6b; padding: 12px;">Error: ${error.message}</div>`;
    }
  }

  function extractEmailContent(emailContainer) {
    // Try to extract the email text
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

    // Center on screen
    dialog.style.left = '50%';
    dialog.style.top = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.width = 'min(680px, 92vw)';

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="Gmail AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">Gmail Assistant</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close">
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
            <span>Email summary</span>
          </div>
          <div class="ai-gmail-summary-content"></div>
        </div>

        <div class="ai-gmail-section">
          <div class="ai-gmail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>Compose response</span>
          </div>
          <div class="ai-followup" style="margin-bottom: 12px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <input type="text" class="ai-gmail-input" placeholder="What do you want to include in your response?" />
            <button class="ai-send-btn ai-gmail-generate-btn" aria-label="Generate">
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
            <span>Generated response</span>
          </div>
          <div class="ai-gmail-response-content" contenteditable="true"></div>
          <div class="ai-gmail-response-actions">
            <button class="ai-gmail-insert-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Insert into Gmail
            </button>
            <button class="ai-gmail-copy-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              Copy
            </button>
            <button class="ai-gmail-regenerate-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Regenerate
            </button>
          </div>
        </div>
      </div>
    `;

    // If there is initial summary, render it
    if (summary) {
      const summaryDiv = dialog.querySelector('.ai-gmail-summary-content');
      MarkdownRenderer.renderToElement(summaryDiv, summary);
    }

    // Make the dialog draggable using the DialogModule function
    makeDraggable(dialog);

    // Dialog events
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
    // Close button
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });

    // Generate response button
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

        // Render with markdown
        MarkdownRenderer.renderToElement(responseContent, response);
        responseSection.style.display = 'block';

        // Clear input
        userInput.value = '';
      } catch (error) {
        alert('Error generating the response: ' + error.message);
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
            Copied
          `;
          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
          }, 2000);
        });
      });
    }

    // Regenerate button
    const regenerateBtn = dialog.querySelector('.ai-gmail-regenerate-btn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', async () => {
        const userContent = userInput.value.trim() || 'Generate a professional response';

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
          alert('Error regenerating: ' + error.message);
        } finally {
          regenerateBtn.disabled = false;
          regenerateBtn.innerHTML = originalHTML;
        }
      });
    }

    // Insert into Gmail button
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
    const prompt = `Original email:
${emailContent}

Content to include in the response:
${userContent}

Generate a professional and cordial response to this email, including the content specified by the user. The response should be clear, well-structured and appropriate for a professional email.`;

    const response = await AIModule.aiAnswer(prompt);
    return response;
  }

  function insertTextIntoGmail(text) {
    // Try to find the reply button and click it
    const replyButton = document.querySelector('[aria-label*="Responder"]') ||
                        document.querySelector('[data-tooltip*="Responder"]') ||
                        document.querySelector('.ams');
    
    if (replyButton) {
      replyButton.click();
      
      // Wait for the reply editor to open
      setTimeout(() => {
        insertIntoGmailEditor(text);
      }, 500);
    } else {
      // If the editor is already open, insert directly
      insertIntoGmailEditor(text);
    }
  }

  function insertIntoGmailEditor(text) {
    // Find the Gmail composition text area
    const composeBox = document.querySelector('[aria-label*="Cuerpo del mensaje"]') ||
                       document.querySelector('[role="textbox"][aria-label]') ||
                       document.querySelector('.editable[role="textbox"]') ||
                       document.querySelector('div[contenteditable="true"]');
    
    if (composeBox) {
      // Insert the text
      composeBox.focus();
      
      // Method 1: Try with execCommand
      document.execCommand('insertText', false, text);
      
      // Method 2: If it doesn't work, insert directly into HTML
      if (!composeBox.innerText.includes(text.substring(0, 20))) {
        const p = document.createElement('p');
        p.textContent = text;
        composeBox.appendChild(p);
      }
      
      // Trigger input event so Gmail detects the change
      composeBox.dispatchEvent(new Event('input', { bubbles: true }));

    } else {
      // If the editor is not found, copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        alert('Text copied to clipboard. Paste it manually in the Gmail editor.');
      });
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public API
  const publicAPI = {
    init,
    handleUnreadSummary
  };

  // Make available globally
  window.GmailModule = publicAPI;

  return publicAPI;
})();



// Creado por David Montero Crespo para WriteBee

const OutlookModule = (function() {
  let outlookButton = null;
  let isOutlook = false;

  function init() {
  // Detect if we are in Outlook
    isOutlook = window.location.hostname.includes('outlook.live.com') || 
                window.location.hostname.includes('outlook.office.com') ||
                window.location.hostname.includes('outlook.office365.com');
    
    if (isOutlook) {

      observeOutlook();
    } else {

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

      insertAIButton(composeEditor);
    } else if (!composeEditor && outlookButton) {
  // If the editor is no longer active, remove the button
      removeAIButton();
    }
  }

  function insertAIButton(composeEditor) {
    // Try to find the Discard button first (top-right corner of compose window)
    const discardButton = document.querySelector('#discardCompose') ||
                         document.querySelector('button[aria-label="Discard"]') ||
                         document.querySelector('button[title*="Discard"]');

    if (discardButton && discardButton.parentElement) {
      // Create AI WriteBee button matching Outlook's style
      outlookButton = document.createElement('button');
      outlookButton.type = 'button';
      outlookButton.className = 'fui-Button r1alrhcs ai-outlook-compose-button';
      outlookButton.setAttribute('aria-label', 'AI WriteBee Assistant');
      outlookButton.setAttribute('title', 'AI WriteBee - Generate email content');
      outlookButton.innerHTML = `
        <span class="fui-Button__icon rywnvv2">
          <div class="ai-avatar" style="width: 20px; height: 20px; font-size: 10px; margin: 0;">
            <div class="eyes"><span></span><span></span></div>
          </div>
        </span>
      `;

      outlookButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAIAssistant(composeEditor);
      });

      // Insert before the Discard button
      discardButton.parentElement.insertBefore(outlookButton, discardButton);
      return;
    }

    // Fallback: Try to find the ribbon bottom bar container
    const ribbonContainer = document.querySelector('.bottomBarContainer-188') ||
                           document.querySelector('[data-automation-type="RibbonBottomBarContainer"]') ||
                           document.querySelector('#innerRibbonContainer');

    if (ribbonContainer) {
      // Find the group container to insert the button
      const groupContainer = ribbonContainer.querySelector('.groupContainer-189') ||
                            ribbonContainer.querySelector('.ms-OverflowSet');

      if (groupContainer) {
        // Create AI WriteBee button matching Outlook's ribbon style
        outlookButton = document.createElement('div');
        outlookButton.className = 'ms-OverflowSet-item ribbonOverflowItem item-170';
        outlookButton.setAttribute('role', 'none');
        outlookButton.innerHTML = `
          <button type="button"
                  class="ai-outlook-ribbon-button fui-Button ms-Button"
                  data-automation-type="RibbonButton"
                  aria-label="AI WriteBee Assistant"
                  title="AI WriteBee - Generate email content">
            <span class="fui-Button__icon">
              <div class="ai-avatar" style="width: 20px; height: 20px; font-size: 10px;">
                <div class="eyes"><span></span><span></span></div>
              </div>
            </span>
            <span class="fui-Button__text" style="font-size: 12px; font-weight: 500;">AI WriteBee</span>
          </button>
        `;

        const button = outlookButton.querySelector('button');
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleAIAssistant(composeEditor);
        });

        // Insert at the beginning of the group container
        if (groupContainer.firstChild) {
          groupContainer.insertBefore(outlookButton, groupContainer.firstChild);
        } else {
          groupContainer.appendChild(outlookButton);
        }

        return;
      }
    }

    // Fallback: Find the area where the compose editor is
    const editorContainer = composeEditor.closest('[role="main"]') ||
                           composeEditor.closest('.customScrollBar') ||
                           composeEditor.parentElement;

    if (!editorContainer) {
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

  }

  function removeAIButton() {
    if (outlookButton) {
      outlookButton.remove();
      outlookButton = null;
    }
  }

  async function handleAIAssistant(composeEditor) {

  // Try to extract the context of the original email (if replying)
    let originalEmailContent = null;
    
  // Find the content of the original email in the reply window
    const originalMessage = document.querySelector('[aria-label*="Mensaje original"]') ||
                           document.querySelector('.rps_b91e') ||
                           document.querySelector('[data-app-section="ReadingPaneBody"]');
    
    if (originalMessage) {
      originalEmailContent = originalMessage.innerText || originalMessage.textContent;

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
    dialog.className = 'ai-result-panel ai-outlook-compose-dialog';
    dialog.dataset.pinned = 'true';

    // Position near the top of the screen
    const dialogWidth = 560;
    const dialogHeight = 600;
    let left = (window.innerWidth - dialogWidth) / 2;
    let top = window.scrollY + 40;

    // Ensure it doesn't go off the bottom
    if (top + dialogHeight > window.scrollY + window.innerHeight - 20) {
      top = window.scrollY + window.innerHeight - dialogHeight - 20;
    }

    dialog.style.left = `${left}px`;
    dialog.style.top = `${top}px`;
    dialog.style.position = 'absolute';
    dialog.style.width = 'min(560px, 92vw)';

    const hasContext = originalEmailContent && originalEmailContent.trim().length > 0;

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="Outlook AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">AI Email Composer - Outlook</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-outlook-toolbar">
        <div class="ai-outlook-dropdown">
          <button class="ai-outlook-dropdown-trigger">
            <span class="selected-template">Select Email Template</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          <div class="ai-outlook-dropdown-menu">
            <button class="ai-outlook-template-item" data-template="professional" data-tip="What's the main purpose? Consider including: Clear objective, Key points or requests, Desired outcome or next steps">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <div class="template-name">Professional Business Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="followup" data-tip="What are you following up on? Consider including: Reference to previous conversation, Current status update, Next action items">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
              <div class="template-name">Follow-up Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="thankyou" data-tip="What are you grateful for? Consider including: Specific action or help received, How it helped you, Future collaboration possibility">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg></div>
              <div class="template-name">Thank You Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="introduction" data-tip="Who are you introducing yourself to? Consider including: Your role and background, Purpose of reaching out, What you can offer or why you're connecting">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              <div class="template-name">Introduction Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="team-member" data-tip="Who is the new team member? Consider including: Name and position, Brief background about them, Why people should be excited to work with them">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
              <div class="template-name">Introduce Team Member</div>
            </button>
            <button class="ai-outlook-template-item" data-template="meeting" data-tip="What's the meeting about? Consider including: Meeting purpose and agenda, Proposed dates/times, Expected duration and attendees">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
              <div class="template-name">Meeting Request</div>
            </button>
            <button class="ai-outlook-template-item" data-template="feedback" data-tip="What feedback are you providing? Consider including: Specific examples, Constructive suggestions, Positive aspects to encourage">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg></div>
              <div class="template-name">Feedback Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="apology" data-tip="What went wrong? Consider including: Specific issue or mistake, How it will be resolved, Steps to prevent it in the future">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
              <div class="template-name">Apology Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="announcement" data-tip="What's the news? Consider including: Main announcement clearly stated, Key details and dates, How it affects recipients">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8.5"/><path d="M6 5L20 12L6 19V5"/></svg></div>
              <div class="template-name">Announcement Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="request" data-tip="What do you need? Consider including: Specific request details, Why you need it, Timeline and urgency level">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/></svg></div>
              <div class="template-name">Request Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="proposal" data-tip="What are you proposing? Consider including: Clear proposal overview, Benefits and value, Next steps or call to action">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div>
              <div class="template-name">Proposal Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="reminder" data-tip="What needs to be remembered? Consider including: What the reminder is about, Important deadline or date, Any action required">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6"/><path d="M22 6l-3-3"/><path d="M6 19l-2 2"/><path d="M18 19l2 2"/></svg></div>
              <div class="template-name">Reminder Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="congratulations" data-tip="What's the achievement? Consider including: Specific accomplishment, Why it's impressive, Well wishes for the future">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
              <div class="template-name">Congratulations Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="welcome" data-tip="Who are you welcoming? Consider including: Warm greeting, What to expect, Available resources or contacts">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11l2 2 4-4"/></svg></div>
              <div class="template-name">Welcome Email</div>
            </button>
            <button class="ai-outlook-template-item" data-template="status-update" data-tip="What's the update? Consider including: Current progress, Challenges or blockers, Next milestones">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
              <div class="template-name">Status Update Email</div>
            </button>
          </div>
        </div>
      </div>

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

        <div class="ai-outlook-template-tip" style="display: none;">
          <div class="ai-outlook-tip-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="ai-outlook-tip-content">
            <strong>Tip:</strong> <span class="ai-outlook-tip-text"></span>
          </div>
        </div>

        <div class="ai-outlook-input-section">
          <textarea
            class="ai-outlook-compose-textarea"
            placeholder="Describe what you want to write in your email..."
            rows="6"
          ></textarea>
        </div>

        <div class="ai-outlook-compose-response" style="display: none;">
          <div class="ai-outlook-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>Generated email</span>
          </div>
          <div class="ai-outlook-compose-response-content" contenteditable="true"></div>
          <div class="ai-outlook-response-actions">
            <button class="ai-outlook-insert-compose-btn" title="Insert into Outlook">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Insert into Outlook</span>
            </button>
            <button class="ai-outlook-copy-btn" title="Copy to clipboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              <span>Copy</span>
            </button>
            <button class="ai-outlook-regenerate-btn" title="Regenerate content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      </div>

      <div class="ai-outlook-footer">
        <div class="ai-outlook-footer-left">
          <div class="ai-outlook-lang">
            <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg></span>
            <select class="ai-outlook-lang-select">
              <option value="en">english</option>
              <option value="es">spanish</option>
              <option value="fr">french</option>
              <option value="de">german</option>
              <option value="pt">portuguese</option>
              <option value="it">italian</option>
            </select>
          </div>
          <button class="ai-outlook-options-btn" title="Content options">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="4" y1="21" x2="4" y2="14"></line>
              <line x1="4" y1="10" x2="4" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12" y2="3"></line>
              <line x1="20" y1="21" x2="20" y2="16"></line>
              <line x1="20" y1="12" x2="20" y2="3"></line>
              <line x1="1" y1="14" x2="7" y2="14"></line>
              <line x1="9" y1="8" x2="15" y2="8"></line>
              <line x1="17" y1="16" x2="23" y2="16"></line>
            </svg>
          </button>
        </div>
        <button class="ai-outlook-generate-compose-btn" title="Generate email">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13"/>
            <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>

      <div class="ai-outlook-options-panel" style="display: none;">
        <div class="ai-outlook-options-content">
          <h3>Length</h3>
          <div class="ai-outlook-button-group" data-option="length">
            <button class="ai-outlook-option-btn selected" data-value="auto">Auto</button>
            <button class="ai-outlook-option-btn" data-value="short">Short</button>
            <button class="ai-outlook-option-btn" data-value="medium">Medium</button>
            <button class="ai-outlook-option-btn" data-value="long">Long</button>
          </div>

          <h3>Formality</h3>
          <div class="ai-outlook-button-group" data-option="formality">
            <button class="ai-outlook-option-btn selected" data-value="auto">Auto</button>
            <button class="ai-outlook-option-btn" data-value="informal">Informal</button>
            <button class="ai-outlook-option-btn" data-value="neutral">Neutral</button>
            <button class="ai-outlook-option-btn" data-value="formal">Formal</button>
          </div>

          <h3>Format</h3>
          <div class="ai-outlook-button-group" data-option="format">
            <button class="ai-outlook-option-btn selected" data-value="auto">Auto</button>
            <button class="ai-outlook-option-btn selected" data-value="email">Email</button>
            <button class="ai-outlook-option-btn" data-value="message">Message</button>
            <button class="ai-outlook-option-btn" data-value="comment">Comment</button>
            <button class="ai-outlook-option-btn" data-value="paragraph">Paragraph</button>
            <button class="ai-outlook-option-btn" data-value="article">Article</button>
            <button class="ai-outlook-option-btn" data-value="blog">Blog Post</button>
            <button class="ai-outlook-option-btn" data-value="ideas">Ideas</button>
            <button class="ai-outlook-option-btn" data-value="outline">Outline</button>
            <button class="ai-outlook-option-btn" data-value="twitter">Twitter</button>
            <button class="ai-outlook-option-btn" data-value="reddit">Reddit</button>
            <button class="ai-outlook-option-btn" data-value="facebook">Facebook</button>
            <button class="ai-outlook-option-btn" data-value="linkedin">LinkedIn</button>
          </div>

          <h3>Tone</h3>
          <div class="ai-outlook-button-group" data-option="tone">
            <button class="ai-outlook-option-btn selected" data-value="auto">Auto</button>
            <button class="ai-outlook-option-btn" data-value="enthusiastic">Enthusiastic</button>
            <button class="ai-outlook-option-btn" data-value="humorous">Humorous</button>
            <button class="ai-outlook-option-btn" data-value="concerned">Concerned</button>
            <button class="ai-outlook-option-btn" data-value="humble">Humble</button>
            <button class="ai-outlook-option-btn" data-value="optimistic">Optimistic</button>
            <button class="ai-outlook-option-btn" data-value="empathetic">Empathetic</button>
            <button class="ai-outlook-option-btn" data-value="frank">Frank</button>
            <button class="ai-outlook-option-btn" data-value="sincere">Sincere</button>
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
    const closeBtn = dialog.querySelector('.close-panel');
    const textarea = dialog.querySelector('.ai-outlook-compose-textarea');
    const generateBtn = dialog.querySelector('.ai-outlook-generate-compose-btn');
    const dropdown = dialog.querySelector('.ai-outlook-dropdown');
    const dropdownTrigger = dialog.querySelector('.ai-outlook-dropdown-trigger');
    const dropdownMenu = dialog.querySelector('.ai-outlook-dropdown-menu');
    const templateItems = dialog.querySelectorAll('.ai-outlook-template-item');
    const selectedTemplateSpan = dialog.querySelector('.selected-template');
    const langSelect = dialog.querySelector('.ai-outlook-lang-select');
    const responseSection = dialog.querySelector('.ai-outlook-compose-response');
    const responseContent = dialog.querySelector('.ai-outlook-compose-response-content');
    const optionsBtn = dialog.querySelector('.ai-outlook-options-btn');
    const optionsPanel = dialog.querySelector('.ai-outlook-options-panel');
    const optionButtons = dialog.querySelectorAll('.ai-outlook-option-btn');
    const templateTip = dialog.querySelector('.ai-outlook-template-tip');
    const templateTipText = dialog.querySelector('.ai-outlook-tip-text');

    let selectedTemplate = null;
    let contentOptions = {
      length: 'auto',
      formality: 'auto',
      format: ['auto', 'email'],
      tone: 'auto'
    };

    // Close
    closeBtn.addEventListener('click', () => dialog.remove());

    // Options button
    if (optionsBtn && optionsPanel) {
      optionsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isVisible = optionsPanel.style.display !== 'none';

        if (!isVisible) {
          // Position the panel above the options button
          const btnRect = optionsBtn.getBoundingClientRect();
          const panelHeight = 400; // max-height from CSS

          // Position above the button
          optionsPanel.style.bottom = `${window.innerHeight - btnRect.top + 8}px`;
          optionsPanel.style.left = `${btnRect.left}px`;
          optionsPanel.style.display = 'block';
        } else {
          optionsPanel.style.display = 'none';
        }

        optionsBtn.classList.toggle('active', !isVisible);
      });
    }

    // Option buttons
    optionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.closest('.ai-outlook-button-group');
        const optionType = group.dataset.option;
        const value = btn.dataset.value;

        // For format, allow multiple selections
        if (optionType === 'format') {
          btn.classList.toggle('selected');
        } else {
          // For other options, only one selection
          group.querySelectorAll('.ai-outlook-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        }

        // Update content options
        if (optionType === 'format') {
          const selectedFormats = Array.from(group.querySelectorAll('.ai-outlook-option-btn.selected'))
            .map(b => b.dataset.value);
          contentOptions[optionType] = selectedFormats;
        } else {
          contentOptions[optionType] = value;
        }
      });
    });

    // Dropdown
    dropdownTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    // Close dropdown and options panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }

      // Close options panel if clicking outside of it and outside of options button
      if (optionsPanel && optionsBtn) {
        if (!optionsPanel.contains(e.target) && !optionsBtn.contains(e.target)) {
          optionsPanel.style.display = 'none';
          optionsBtn.classList.remove('active');
        }
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

        // Show template tip
        const tip = item.dataset.tip;
        if (tip) {
          templateTipText.textContent = tip;
          templateTip.style.display = 'flex';
        } else {
          templateTip.style.display = 'none';
        }
      });
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
      generateBtn.style.position = 'relative';
      generateBtn.style.pointerEvents = 'none';
      const originalHTML = generateBtn.innerHTML;
      generateBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spinner-animation">
          <circle cx="12" cy="12" r="10" opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
          </path>
        </svg>
      `;

      try {
        // Show response section immediately
        responseSection.style.display = 'block';
        responseContent.textContent = '';

        // Use streaming for real-time text generation
        await generateEmailContentStream(userInput, selectedTemplate, language, contentOptions, responseContent);

        textarea.value = '';

        // Hide only the generate button when generation completes successfully
        generateBtn.style.display = 'none';

        // Adjust dialog position to keep it visible
        const dialogRect = dialog.getBoundingClientRect();
        const viewportHeight = window.innerHeight;

        if (dialogRect.bottom > viewportHeight) {
          // Dialog is going off screen at the bottom, reposition it
          const newTop = Math.max(20, viewportHeight - dialogRect.height - 20);
          dialog.style.top = `${newTop}px`;
          dialog.style.transform = 'none';
        }
      } catch (error) {
        alert('Error: ' + error.message);
        responseContent.textContent = 'Error generating email. Please try again.';
        // Restore button on error
        generateBtn.disabled = false;
        generateBtn.innerHTML = originalHTML;
      }
    });

    // Insert into Outlook compose
    const insertBtn = dialog.querySelector('.ai-outlook-insert-compose-btn');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        const text = responseContent.innerText;
        insertTextIntoOutlookEditor(composeEditor, text);

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
      });
    }

    // Copy
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

    // Regenerate
    const regenerateBtn = dialog.querySelector('.ai-outlook-regenerate-btn');
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
          responseContent.textContent = '';
          // Use streaming for real-time text generation
          await generateEmailContentStream(userInput, selectedTemplate, language, contentOptions, responseContent);
        } catch (error) {
          alert('Error: ' + error.message);
        } finally {
          regenerateBtn.disabled = false;
          regenerateBtn.innerHTML = originalHTML;
        }
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

  async function generateEmailContentStream(userInput, template, language, options = {}, targetElement) {
    let templateInstruction = '';

    switch (template) {
      case 'professional':
        templateInstruction = 'Structure: Professional greeting → Clear purpose → Details/Context → Call to action → Professional closing';
        break;
      case 'followup':
        templateInstruction = 'Structure: Reference to previous conversation → Update/Question → Next steps → Polite closing';
        break;
      case 'thankyou':
        templateInstruction = 'Structure: Express gratitude → Specific reason for thanks → Impact/Appreciation → Future collaboration';
        break;
      case 'introduction':
        templateInstruction = 'Structure: Brief self-introduction → Purpose of contact → Value proposition → Call to action';
        break;
      case 'team-member':
        templateInstruction = 'Structure: Introduction announcement → Team member details (name, role, background) → What they bring to the team → Welcome message';
        break;
      case 'meeting':
        templateInstruction = 'Structure: Purpose of meeting → Proposed time/date options → Agenda items → Request for confirmation';
        break;
      case 'feedback':
        templateInstruction = 'Structure: Context and purpose → Specific observations → Constructive suggestions → Encouragement and support';
        break;
      case 'apology':
        templateInstruction = 'Structure: Sincere apology → Explanation (brief) → Solution/Correction → Commitment to improvement';
        break;
      case 'announcement':
        templateInstruction = 'Structure: Main announcement → Key details → Impact/Benefits → Additional information/Resources';
        break;
      case 'request':
        templateInstruction = 'Structure: Context → Specific request → Justification → Timeline → Appreciation';
        break;
      case 'proposal':
        templateInstruction = 'Structure: Introduction and context → Proposal details → Benefits and value → Next steps and call to action';
        break;
      case 'reminder':
        templateInstruction = 'Structure: Friendly reminder → Important details/deadlines → Action required → Contact information if needed';
        break;
      case 'congratulations':
        templateInstruction = 'Structure: Congratulatory opening → Specific achievement mentioned → Why it matters → Well wishes for future';
        break;
      case 'welcome':
        templateInstruction = 'Structure: Warm welcome → Overview of what to expect → Resources and contacts → Invitation to reach out';
        break;
      case 'status-update':
        templateInstruction = 'Structure: Summary of current status → Progress made → Challenges or blockers → Next steps and timeline';
        break;
      default:
        templateInstruction = 'Clear and professional email structure';
    }

    // Build additional instructions based on options
    let additionalInstructions = [];

    if (options.length && options.length !== 'auto') {
      const lengthMap = {
        short: '50-100 words',
        medium: '150-250 words',
        long: '300-500 words'
      };
      additionalInstructions.push(`Length: ${lengthMap[options.length] || 'flexible'}`);
    }

    if (options.formality && options.formality !== 'auto') {
      additionalInstructions.push(`Formality level: ${options.formality}`);
    }

    if (options.tone && options.tone !== 'auto') {
      additionalInstructions.push(`Tone: ${options.tone}`);
    }

    if (options.format && Array.isArray(options.format)) {
      const formats = options.format.filter(f => f !== 'auto');
      if (formats.length > 0) {
        additionalInstructions.push(`Format style: ${formats.join(', ')}`);
      }
    } else if (options.format && options.format !== 'auto') {
      additionalInstructions.push(`Format style: ${options.format}`);
    }

    const prompt = `Email content description:
${userInput}

Template: ${template || 'general'}
${templateInstruction}

Language: ${language}

${additionalInstructions.length > 0 ? additionalInstructions.join('\n') + '\n' : ''}
Generate a professional email that is:
- Clear and concise
- Well-structured with proper paragraphs
- Appropriate tone for business communication
- Includes a proper greeting and closing
- Don't give me the subject

Do not include subject line, just the email body.`;

    // Use streaming to generate text progressively
    let generatedText = '';
    await AIModule.aiAnswerStream(prompt, (fullText) => {
      generatedText = fullText;
      targetElement.textContent = fullText;
    });

    // After streaming completes, render markdown
    MarkdownRenderer.renderToElement(targetElement, generatedText);

    return generatedText;
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

  return publicAPI;
})();



// Creado por David Montero Crespo para WriteBee

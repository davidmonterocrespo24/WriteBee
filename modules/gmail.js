const GmailModule = (function() {
  let gmailButton = null;
  let composeButton = null;
  let isGmail = false;

  function init() {
    // Detect if we are in Gmail
    isGmail = window.location.hostname.includes('mail.google.com');

    if (isGmail) {

      observeGmail();
    }
  }

  function observeGmail() {
    // Observe DOM changes to detect when an email is opened or compose window is opened
    const observer = new MutationObserver(() => {
      checkForEmailView();
      checkForComposeWindow();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Check immediately
    setTimeout(() => {
      checkForEmailView();
      checkForComposeWindow();
    }, 1000);
  }

  function checkForComposeWindow() {
    // Find all compose windows (both popups and full windows)
    const composeWindows = document.querySelectorAll('[role="dialog"]');

    composeWindows.forEach(composeWindow => {
      // Check if it's actually a compose window by looking for the compose toolbar
      const composeToolbar = composeWindow.querySelector('[role="toolbar"]');
      const subjectInput = composeWindow.querySelector('input[name="subjectbox"]');

      if (composeToolbar && subjectInput) {
        // Check if button already exists in this compose window
        if (!composeWindow.querySelector('.ai-gmail-compose-btn')) {
          insertComposeButton(composeWindow);
        }
      }
    });
  }

  function insertComposeButton(composeWindow) {
    // Find the toolbar at the bottom of the compose window
    const toolbar = composeWindow.querySelector('[role="toolbar"]');

    if (!toolbar) {
      return;
    }

    // Create AI compose button
    const btn = document.createElement('button');
    btn.className = 'ai-gmail-compose-btn';
    btn.setAttribute('aria-label', 'AI WriteBee');
    btn.setAttribute('type', 'button');
    btn.innerHTML = `
      <div class="ai-avatar" style="width: 18px; height: 18px; font-size: 9px; margin-right: 6px;">
        <div class="eyes"><span></span><span></span></div>
      </div>
      <span>AI WriteBee</span>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent multiple dialogs
      if (document.querySelector('.ai-gmail-compose-dialog')) {
        return;
      }

      handleComposeEmail(composeWindow, btn);
    });

    // Insert the button at the beginning of the toolbar
    toolbar.insertBefore(btn, toolbar.firstChild);
  }

  async function handleComposeEmail(composeWindow, buttonElement) {
    // Create compose dialog with templates
    const dialog = createComposeDialog(composeWindow, buttonElement);
    document.body.appendChild(dialog);
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

  function createComposeDialog(composeWindow, buttonElement) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-gmail-compose-dialog';
    dialog.dataset.pinned = 'true';

    // Position the dialog near the top of the screen
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const dialogWidth = 560;
      const dialogHeight = 600;

      // Position to the right of the button
      let left = rect.right + 20;
      // Start near the top of the viewport (40px from top)
      let top = window.scrollY + 40;

      // If it goes off screen to the right, position to the left of the button
      if (left + dialogWidth > window.innerWidth) {
        left = rect.left - dialogWidth - 20;
      }

      // If it still goes off to the left, center on screen
      if (left < 20) {
        left = (window.innerWidth - dialogWidth) / 2;
      }

      // Ensure it doesn't go off the bottom
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

    dialog.style.width = 'min(560px, 92vw)';

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="Gmail AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">AI Email Composer</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-gmail-toolbar">
        <div class="ai-gmail-dropdown">
          <button class="ai-gmail-dropdown-trigger">
            <span class="selected-template">Select Email Template</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>
          <div class="ai-gmail-dropdown-menu">
            <button class="ai-gmail-template-item" data-template="professional" data-tip="What's the main purpose? Consider including: Clear objective, Key points or requests, Desired outcome or next steps">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
              <div class="template-name">Professional Business Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="followup" data-tip="What are you following up on? Consider including: Reference to previous conversation, Current status update, Next action items">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
              <div class="template-name">Follow-up Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="thankyou" data-tip="What are you grateful for? Consider including: Specific action or help received, How it helped you, Future collaboration possibility">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg></div>
              <div class="template-name">Thank You Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="introduction" data-tip="Who are you introducing yourself to? Consider including: Your role and background, Purpose of reaching out, What you can offer or why you're connecting">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
              <div class="template-name">Introduction Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="team-member" data-tip="Who is the new team member? Consider including: Name and position, Brief background about them, Why people should be excited to work with them">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
              <div class="template-name">Introduce Team Member</div>
            </button>
            <button class="ai-gmail-template-item" data-template="meeting" data-tip="What's the meeting about? Consider including: Meeting purpose and agenda, Proposed dates/times, Expected duration and attendees">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
              <div class="template-name">Meeting Request</div>
            </button>
            <button class="ai-gmail-template-item" data-template="feedback" data-tip="What feedback are you providing? Consider including: Specific examples, Constructive suggestions, Positive aspects to encourage">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg></div>
              <div class="template-name">Feedback Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="apology" data-tip="What went wrong? Consider including: Specific issue or mistake, How it will be resolved, Steps to prevent it in the future">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
              <div class="template-name">Apology Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="announcement" data-tip="What's the news? Consider including: Main announcement clearly stated, Key details and dates, How it affects recipients">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.5 5H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-8.5"/><path d="M6 5L20 12L6 19V5"/></svg></div>
              <div class="template-name">Announcement Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="request" data-tip="What do you need? Consider including: Specific request details, Why you need it, Timeline and urgency level">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17"/></svg></div>
              <div class="template-name">Request Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="proposal" data-tip="What are you proposing? Consider including: Clear proposal overview, Benefits and value, Next steps or call to action">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div>
              <div class="template-name">Proposal Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="reminder" data-tip="What needs to be remembered? Consider including: What the reminder is about, Important deadline or date, Any action required">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6"/><path d="M22 6l-3-3"/><path d="M6 19l-2 2"/><path d="M18 19l2 2"/></svg></div>
              <div class="template-name">Reminder Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="congratulations" data-tip="What's the achievement? Consider including: Specific accomplishment, Why it's impressive, Well wishes for the future">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>
              <div class="template-name">Congratulations Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="welcome" data-tip="Who are you welcoming? Consider including: Warm greeting, What to expect, Available resources or contacts">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11l2 2 4-4"/></svg></div>
              <div class="template-name">Welcome Email</div>
            </button>
            <button class="ai-gmail-template-item" data-template="status-update" data-tip="What's the update? Consider including: Current progress, Challenges or blockers, Next milestones">
              <div class="template-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
              <div class="template-name">Status Update Email</div>
            </button>
          </div>
        </div>
      </div>

      <div class="ai-result-body">
        <div class="ai-gmail-template-tip" style="display: none;">
          <div class="ai-gmail-tip-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="ai-gmail-tip-content">
            <strong>Tip:</strong> <span class="ai-gmail-tip-text"></span>
          </div>
        </div>
        <div class="ai-gmail-input-section">
          <textarea
            class="ai-gmail-compose-textarea"
            placeholder="Describe what you want to write in your email..."
            rows="6"
          ></textarea>
        </div>

        <div class="ai-gmail-compose-response" style="display: none;">
          <div class="ai-gmail-section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>Generated email</span>
          </div>
          <div class="ai-gmail-compose-response-content" contenteditable="true"></div>
          <div class="ai-gmail-response-actions">
            <button class="ai-gmail-insert-compose-btn" title="Insert into Gmail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span>Insert into Gmail</span>
            </button>
            <button class="ai-gmail-copy-btn" title="Copy to clipboard">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                <rect x="5" y="5" width="10" height="10" rx="2"></rect>
              </svg>
              <span>Copy</span>
            </button>
            <button class="ai-gmail-regenerate-btn" title="Regenerate content">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      </div>

      <div class="ai-gmail-footer">
        <div class="ai-gmail-footer-left">
          <div class="ai-gmail-lang">
            <span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg></span>
            <select class="ai-gmail-lang-select">
              <option value="en">english</option>
              <option value="es">spanish</option>
              <option value="fr">french</option>
              <option value="de">german</option>
              <option value="pt">portuguese</option>
              <option value="it">italian</option>
            </select>
          </div>
          <button class="ai-gmail-options-btn" title="Content options">
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
        <button class="ai-gmail-generate-compose-btn" title="Generate email">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13"/>
            <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
          </svg>
        </button>
      </div>

      <div class="ai-gmail-options-panel" style="display: none;">
        <div class="ai-gmail-options-content">
          <h3>Length</h3>
          <div class="ai-gmail-button-group" data-option="length">
            <button class="ai-gmail-option-btn selected" data-value="auto">Auto</button>
            <button class="ai-gmail-option-btn" data-value="short">Short</button>
            <button class="ai-gmail-option-btn" data-value="medium">Medium</button>
            <button class="ai-gmail-option-btn" data-value="long">Long</button>
          </div>

          <h3>Formality</h3>
          <div class="ai-gmail-button-group" data-option="formality">
            <button class="ai-gmail-option-btn selected" data-value="auto">Auto</button>
            <button class="ai-gmail-option-btn" data-value="informal">Informal</button>
            <button class="ai-gmail-option-btn" data-value="neutral">Neutral</button>
            <button class="ai-gmail-option-btn" data-value="formal">Formal</button>
          </div>

          <h3>Format</h3>
          <div class="ai-gmail-button-group" data-option="format">
            <button class="ai-gmail-option-btn selected" data-value="auto">Auto</button>
            <button class="ai-gmail-option-btn selected" data-value="email">Email</button>
            <button class="ai-gmail-option-btn" data-value="message">Message</button>
            <button class="ai-gmail-option-btn" data-value="comment">Comment</button>
            <button class="ai-gmail-option-btn" data-value="paragraph">Paragraph</button>
            <button class="ai-gmail-option-btn" data-value="article">Article</button>
            <button class="ai-gmail-option-btn" data-value="blog">Blog Post</button>
            <button class="ai-gmail-option-btn" data-value="ideas">Ideas</button>
            <button class="ai-gmail-option-btn" data-value="outline">Outline</button>
            <button class="ai-gmail-option-btn" data-value="twitter">Twitter</button>
            <button class="ai-gmail-option-btn" data-value="reddit">Reddit</button>
            <button class="ai-gmail-option-btn" data-value="facebook">Facebook</button>
            <button class="ai-gmail-option-btn" data-value="linkedin">LinkedIn</button>
          </div>

          <h3>Tone</h3>
          <div class="ai-gmail-button-group" data-option="tone">
            <button class="ai-gmail-option-btn selected" data-value="auto">Auto</button>
            <button class="ai-gmail-option-btn" data-value="enthusiastic">Enthusiastic</button>
            <button class="ai-gmail-option-btn" data-value="humorous">Humorous</button>
            <button class="ai-gmail-option-btn" data-value="concerned">Concerned</button>
            <button class="ai-gmail-option-btn" data-value="humble">Humble</button>
            <button class="ai-gmail-option-btn" data-value="optimistic">Optimistic</button>
            <button class="ai-gmail-option-btn" data-value="empathetic">Empathetic</button>
            <button class="ai-gmail-option-btn" data-value="frank">Frank</button>
            <button class="ai-gmail-option-btn" data-value="sincere">Sincere</button>
          </div>
        </div>
      </div>
    `;

    makeDraggable(dialog);
    setupComposeDialogEvents(dialog, composeWindow);

    return dialog;
  }

  function setupComposeDialogEvents(dialog, composeWindow) {
    const closeBtn = dialog.querySelector('.close-panel');
    const textarea = dialog.querySelector('.ai-gmail-compose-textarea');
    const generateBtn = dialog.querySelector('.ai-gmail-generate-compose-btn');
    const dropdown = dialog.querySelector('.ai-gmail-dropdown');
    const dropdownTrigger = dialog.querySelector('.ai-gmail-dropdown-trigger');
    const dropdownMenu = dialog.querySelector('.ai-gmail-dropdown-menu');
    const templateItems = dialog.querySelectorAll('.ai-gmail-template-item');
    const selectedTemplateSpan = dialog.querySelector('.selected-template');
    const langSelect = dialog.querySelector('.ai-gmail-lang-select');
    const responseSection = dialog.querySelector('.ai-gmail-compose-response');
    const responseContent = dialog.querySelector('.ai-gmail-compose-response-content');
    const optionsBtn = dialog.querySelector('.ai-gmail-options-btn');
    const optionsPanel = dialog.querySelector('.ai-gmail-options-panel');
    const optionButtons = dialog.querySelectorAll('.ai-gmail-option-btn');
    const templateTip = dialog.querySelector('.ai-gmail-template-tip');
    const templateTipText = dialog.querySelector('.ai-gmail-tip-text');

    let selectedTemplate = null;
    let contentOptions = {
      length: 'auto',
      formality: 'auto',
      format: 'email',
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

          console.log('Panel positioned at:', {
            bottom: optionsPanel.style.bottom,
            left: optionsPanel.style.left
          });
        } else {
          optionsPanel.style.display = 'none';
        }

        optionsBtn.classList.toggle('active', !isVisible);
        console.log('Options panel toggled:', optionsPanel.style.display);
      });
    } else {
      console.error('Options button or panel not found', { optionsBtn, optionsPanel });
    }

    // Option buttons
    optionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const group = btn.closest('.ai-gmail-button-group');
        const optionType = group.dataset.option;
        const value = btn.dataset.value;

        // For format, allow multiple selections
        if (optionType === 'format') {
          btn.classList.toggle('selected');
        } else {
          // For other options, only one selection
          group.querySelectorAll('.ai-gmail-option-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        }

        // Update content options
        if (optionType === 'format') {
          const selectedFormats = Array.from(group.querySelectorAll('.ai-gmail-option-btn.selected'))
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

    // Insert into Gmail compose
    const insertBtn = dialog.querySelector('.ai-gmail-insert-compose-btn');
    if (insertBtn) {
      insertBtn.addEventListener('click', () => {
        const text = responseContent.innerText;

        // Find the compose editor in the compose window
        const composeEditor = composeWindow.querySelector('[role="textbox"][aria-label*="body"]') ||
                              composeWindow.querySelector('[contenteditable="true"][aria-label]') ||
                              composeWindow.querySelector('div[contenteditable="true"]');

        if (composeEditor) {
          composeEditor.focus();
          composeEditor.innerHTML = `<div>${text.replace(/\n/g, '<br>')}</div>`;

          // Trigger input event so Gmail detects the change
          composeEditor.dispatchEvent(new Event('input', { bubbles: true }));

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
        } else {
          alert('Could not find Gmail editor. Please try again.');
        }
      });
    }

    // Copy
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

    // Regenerate
    const regenerateBtn = dialog.querySelector('.ai-gmail-regenerate-btn');
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
    // Note: onChunk receives the full accumulated text, not just the delta
    let generatedText = '';
    await AIModule.aiAnswerStream(prompt, (fullText) => {
      generatedText = fullText;
      targetElement.textContent = fullText;
    });

    // After streaming completes, render markdown
    MarkdownRenderer.renderToElement(targetElement, generatedText);

    return generatedText;
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

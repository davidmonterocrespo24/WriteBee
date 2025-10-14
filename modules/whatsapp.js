// ⚠️ CRITICAL: Intercept IMMEDIATELY when the script loads
// This must be executed BEFORE WhatsApp creates any blob
// Runs OUTSIDE the module to ensure it executes immediately
const capturedAudioBlobs = new Map(); // Global to be accessible

(function setupGlobalInterceptor() {
  console.log('🎣 [GLOBAL] Setting up audio blob interceptor...');
  
  // Save the original function
  const originalCreateObjectURL = URL.createObjectURL;
  
  // Overwrite URL.createObjectURL GLOBALLY
  URL.createObjectURL = function(blob) {
    const blobUrl = originalCreateObjectURL.call(this, blob);
    
    // Log ALL blobs for debugging
    console.log('🔍 createObjectURL called:', {
      url: blobUrl.substring(0, 50) + '...', 
      type: blob?.type || 'unknown',
      size: blob?.size || 0,
      isAudio: blob?.type?.startsWith('audio/')
    });
    
    // If it's an audio, save it
    if (blob && blob.type && blob.type.startsWith('audio/')) {
      console.log('✅ AUDIO BLOB CAPTURED!', {
        url: blobUrl,
        size: blob.size,
        type: blob.type,
        sizeKB: (blob.size / 1024).toFixed(2) + ' KB'
      });
      
      // Save the blob with its URL
      capturedAudioBlobs.set(blobUrl, blob);
      
      // Clean up old blobs after 5 minutes
      setTimeout(() => {
        if (capturedAudioBlobs.has(blobUrl)) {
          capturedAudioBlobs.delete(blobUrl);
          console.log('🗑️ Blob cleaned from cache:', blobUrl);
        }
      }, 5 * 60 * 1000);
    }
    
    return blobUrl;
  };
  
  console.log('✅ [GLOBAL] Interceptor installed - Waiting for audio blobs...');
})();

// Now the WhatsApp module
const WhatsAppModule = (function() {
  let whatsappButtons = new Set();
  let isWhatsApp = false;
  // capturedAudioBlobs is already available globally

  function init() {
    // Detect if we are on WhatsApp Web
    isWhatsApp = window.location.hostname.includes('web.whatsapp.com');

    if (isWhatsApp) {
      console.log('💬 WhatsApp Web detected, starting module...');
      console.log('📊 Interceptor status: Blobs in cache:', capturedAudioBlobs.size);
      observeWhatsApp();
    }
  }

  function observeWhatsApp() {
    const observer = new MutationObserver(() => {
      checkForMessageArea();
      checkForAudioMessages();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Check immediately
    setTimeout(() => {
      checkForMessageArea();
      checkForAudioMessages();
    }, 2000);
  }

  /**
   * Detect message composition area to add AI response button
   */
  function checkForMessageArea() {
    // Find the footer where the message input is
    const messageFooter = document.querySelector('footer[data-testid="conversation-compose-box-input"]') ||
                         document.querySelector('footer');

    if (!messageFooter) return;

    // Find the button toolbar (emojis, attach, etc.)
    const buttonPanel = messageFooter.querySelector('[data-testid="compose-btn-send"]')?.parentElement?.parentElement;

    if (buttonPanel && !buttonPanel.querySelector('.ai-whatsapp-btn-compose')) {
      console.log('💬 WhatsApp: Inserting AI composition button');
      insertComposeButton(buttonPanel, messageFooter);
    }
  }

  /**
   * Detect audio messages to add transcription button
   */
  function checkForAudioMessages() {
    // Find all audio messages (play buttons)
    const audioButtons = document.querySelectorAll('[aria-label*="Play voice message"], [data-icon="audio-play"]');

    audioButtons.forEach(audioBtn => {
      // Find the complete message container
      const messageContainer = audioBtn.closest('div[class*="message-"]') || 
                              audioBtn.closest('div.focusable-list-item');

      if (messageContainer && !messageContainer.querySelector('.ai-whatsapp-transcribe-btn')) {
        console.log('🎤 WhatsApp: Audio detected, inserting AI transcription button');
        insertTranscribeButton(messageContainer, audioBtn);
      }
    });
  }

  /**
   * Insert AI button in the composition area
   */
  function insertComposeButton(buttonPanel, footer) {
    const btn = document.createElement('button');
    btn.className = 'ai-whatsapp-btn-compose';
    btn.setAttribute('aria-label', 'Generate AI Response');
    btn.setAttribute('type', 'button');

    btn.innerHTML = `
      <div class="ai-avatar" style="width: 24px; height: 24px; font-size: 12px; background: #00a884;">
        <div class="eyes"><span></span><span></span></div>
      </div>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent multiple dialogs
      if (document.querySelector('.ai-whatsapp-dialog')) {
        console.log('💬 WhatsApp: A dialog is already open');
        return;
      }

      console.log('💬 WhatsApp: Generating AI Response...');
      handleGenerateReply(footer, btn);
    });

    buttonPanel.appendChild(btn);
    whatsappButtons.add(btn);
    console.log('✅ WhatsApp: Composition button inserted');
  }

  /**
   * Insert transcription button next to audio messages
   */
  function insertTranscribeButton(messageContainer, audioElement) {
    const btn = document.createElement('button');
    btn.className = 'ai-whatsapp-transcribe-btn';
    btn.setAttribute('aria-label', 'Transcribe with AI');
    btn.setAttribute('type', 'button');
    btn.title = 'Transcribe audio with AI';

    // Inline styles to ensure visibility
    btn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 1000;
      background: #00a884;
      border: none;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    `;

    btn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="white">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" fill="none" stroke="white" stroke-width="2"/>
        <text x="12" y="17" text-anchor="middle" font-size="5" fill="white" font-weight="bold">AI</text>
      </svg>
    `;

    // Hover effect
    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#06cf9c';
      btn.style.transform = 'scale(1.1)';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.background = '#00a884';
      btn.style.transform = 'scale(1)';
    });

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log('🎤 WhatsApp: Transcribing audio...');
      await handleTranscribeAudio(audioElement, btn, messageContainer);
    });

    // Ensure the container has position relative
    messageContainer.style.position = 'relative';
    
    // Insert the button at the beginning of the container to make it visible
    messageContainer.insertBefore(btn, messageContainer.firstChild);

    console.log('✅ WhatsApp: AI transcription button inserted');
  }

  /**
   * Generate AI response based on conversation context
   */
  async function handleGenerateReply(footer, buttonElement) {
    // Extract recent messages from the conversation
    const messages = extractConversationContext();

    if (!messages || messages.length === 0) {
      console.log('⚠️ Could not extract conversation context');
    }

    // Create dialog to generate response
    const dialog = createWhatsAppDialog('compose', messages, buttonElement);
    document.body.appendChild(dialog);
  }

  /**
   * Transcribe audio message
   */
  async function handleTranscribeAudio(audioElement, buttonElement, container) {
    try {
      console.log('🎤 WhatsApp: Starting transcription process...');
      
      // Show loading state
      buttonElement.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" class="ai-spinner">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      `;
      buttonElement.disabled = true;

      // Step 1: Try to get intercepted blob
      let audioBlob = await tryGetInterceptedBlob(container);
      
      if (audioBlob) {
        console.log('✅ Audio obtained from intercepted blobs!');
        await transcribeAudioDirectly(audioBlob, buttonElement, container);
        return;
      }
      
      // Step 2: If no intercepted blob, click and wait
      console.log('🔄 Trying to click play to capture blob...');
      audioBlob = await clickAndCaptureBlob(container);
      
      if (audioBlob) {
        console.log('✅ Audio captured after click!');
        await transcribeAudioDirectly(audioBlob, buttonElement, container);
        return;
      }
      
      // Step 3: If everything fails, show manual options
      console.log('⚠️ Could not capture audio automatically');
      console.log('📋 Showing transcription options to user...');
      
      const dialog = createWhatsAppDialog('transcribe', null, buttonElement, container);
      document.body.appendChild(dialog);
      
      // Restore button
      buttonElement.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" fill="none" stroke="white" stroke-width="2"/>
          <text x="12" y="17" text-anchor="middle" font-size="5" fill="white" font-weight="bold">AI</text>
        </svg>
      `;
      buttonElement.disabled = false;

    } catch (error) {
      console.error('Error transcribing:', error);
      alert('Error: ' + error.message);
      
      // Restore button
      buttonElement.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" fill="none" stroke="white" stroke-width="2"/>
          <text x="12" y="17" text-anchor="middle" font-size="5" fill="white" font-weight="bold">AI</text>
        </svg>
      `;
      buttonElement.disabled = false;
    }
  }

  /**
   * Try to get blob from already intercepted ones
   */
  async function tryGetInterceptedBlob(container) {
    console.log('🔍 Searching in intercepted blobs...');
    console.log(`📦 Blobs in cache: ${capturedAudioBlobs.size}`);
    
    if (capturedAudioBlobs.size === 0) {
      return null;
    }
    
    // If there is only one blob, use that one
    if (capturedAudioBlobs.size === 1) {
      const blob = Array.from(capturedAudioBlobs.values())[0];
      console.log('✅ Using the only available blob:', blob.size, 'bytes');
      return blob;
    }
    
    // If there are multiple, try to find the most recent
    const blobs = Array.from(capturedAudioBlobs.entries());
    const latestBlob = blobs[blobs.length - 1][1];
    console.log('✅ Using the most recent blob:', latestBlob.size, 'bytes');
    return latestBlob;
  }

  /**
   * Click play and capture the created blob
   */
  async function clickAndCaptureBlob(container) {
    // Find the play button with multiple strategies
    let playButton = null;
    
    // Strategy 1: Search in the container
    playButton = container.querySelector('button[aria-label*="Play voice message"]') ||
                 container.querySelector('button[aria-label*="Play"]') ||
                 container.querySelector('[data-icon="audio-play"]')?.closest('button');
    
    // Strategy 2: If the container IS the button
    if (!playButton && container.tagName === 'BUTTON' && container.getAttribute('aria-label')?.includes('Play')) {
      playButton = container;
    }
    
    // Strategy 3: Search in the parent of the container
    if (!playButton && container.parentElement) {
      playButton = container.parentElement.querySelector('button[aria-label*="Play"]');
    }
    
    // Strategy 4: Search in the siblings of the container
    if (!playButton && container.parentElement) {
      const siblings = Array.from(container.parentElement.querySelectorAll('button'));
      playButton = siblings.find(btn => btn.getAttribute('aria-label')?.includes('Play'));
    }
    
    if (!playButton) {
      console.log('⚠️ Play button not found');
      console.log('📦 Container received:', container);
      console.log('🏷️ Container tag:', container.tagName);
      console.log('🔍 Container aria-label:', container.getAttribute?.('aria-label'));
      return null;
    }
    
    const initialBlobCount = capturedAudioBlobs.size;
    console.log('🎬 Clicking play...');
    console.log('📊 Blobs before click:', initialBlobCount);
    console.log('🎯 Button found:', playButton.getAttribute('aria-label'));
    
    // Click
    playButton.click();
    
    // Wait up to 3 seconds for a new blob to be captured
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (capturedAudioBlobs.size > initialBlobCount) {
        console.log(`✅ New blob captured after ${(i + 1) * 100}ms`);
        
        // Pause the audio
        const pauseButton = container.querySelector('button[aria-label*="Pause"]') ||
                           playButton.parentElement?.querySelector('button[aria-label*="Pause"]');
        if (pauseButton) {
          setTimeout(() => pauseButton.click(), 100);
        }
        
        // Get the new blob
        const blobs = Array.from(capturedAudioBlobs.values());
        return blobs[blobs.length - 1];
      }
    }
    
    console.log('⏱️ Timeout: No new blob captured');
    console.log('💡 Possible causes:');
    console.log('   - The interceptor was not installed in time');
    console.log('   - WhatsApp uses another method to create blobs');
    console.log('   - The audio is already in cache and is not recreated');
    return null;
  }

  /**
   * Extract audio directly from the WhatsApp message
   */
  async function extractAudioFromWhatsApp(audioElement, container) {
    try {
      console.log('🔍 Trying to extract audio from WhatsApp message...');
      console.log('📦 Container:', container);
      console.log('🎵 Audio element:', audioElement);

      // Save the initial number of audios
      const initialAudioCount = document.querySelectorAll('audio').length;
      console.log(` Initial audios on the page: ${initialAudioCount}`);

      // Improved method: Simulate click and observe DOM changes
      const playButton = container.querySelector('button[aria-label*="Play voice message"]') ||
                        container.querySelector('[aria-label*="Play"]') ||
                        container.querySelector('[data-icon="audio-play"]') ||
                        container.querySelector('button svg[title="audio-play"]')?.closest('button') ||
                        audioElement;
      
      if (playButton) {
        console.log('🎬 Simulating click on play button...', playButton);
        
        // Create an observer to detect new <audio> elements
        let foundAudio = null;
        const audioObserver = new MutationObserver((mutations) => {
          const audioElements = document.querySelectorAll('audio');
          console.log(`🔄 Observer detected change - Total audios: ${audioElements.length}`);
          
          for (const audio of audioElements) {
            console.log('🎵 Audio found:', {
              src: audio.src,
              hasBlob: audio.src.startsWith('blob:'),
              readyState: audio.readyState,
              duration: audio.duration
            });
            
            if (audio.src && audio.src.startsWith('blob:')) {
              console.log('✅ Audio blob detected by observer:', audio.src);
              foundAudio = audio;
            }
          }
        });

        // Observe the entire document with all possible options
        audioObserver.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['src'],
          attributeOldValue: false
        });

        // Click play
        playButton.click();
        console.log('✅ Click executed on the button');
        
        // Wait for WhatsApp to create the audio element (up to 5 seconds)
        for (let i = 0; i < 50; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (foundAudio) {
            console.log('🎯 Audio found on attempt', i + 1, '(', (i + 1) * 100, 'ms)');
            break;
          }

          // Search manually also in each iteration
          // Search in the ENTIRE document, including iframes and shadow DOM
          const audioElements = [];
          
          // Method 1: Standard search
          audioElements.push(...document.querySelectorAll('audio'));
          
          // Method 2: Search in all shadow roots
          const allElements = document.querySelectorAll('*');
          allElements.forEach(el => {
            if (el.shadowRoot) {
              const shadowAudios = el.shadowRoot.querySelectorAll('audio');
              audioElements.push(...shadowAudios);
            }
          });
          
          // Method 3: Search for elements with media role
          const mediaElements = document.querySelectorAll('[role="audio"], audio, video');
          audioElements.push(...mediaElements);
          
          if (audioElements.length > 0 && i % 5 === 0) {
            console.log(`🔍 Manual search #${Math.floor(i/5) + 1} - Audios found: ${audioElements.length}`);
          }
          
          for (const audio of audioElements) {
            if (audio.src && audio.src.startsWith('blob:')) {
              console.log('✅ Audio blob found manually on attempt', i + 1);
              console.log('📊 Details:', {
                src: audio.src,
                duration: audio.duration,
                readyState: audio.readyState,
                paused: audio.paused
              });
              foundAudio = audio;
              break;
            }
          }

          if (foundAudio) break;
        }

        audioObserver.disconnect();

        if (foundAudio) {
          console.log('🎵 Converting blob to audio file...');
          console.log('📦 Audio element:', foundAudio);
          console.log('🔗 Blob URL:', foundAudio.src);
          
          try {
            // Get the audio blob using fetch
            console.log('🌐 Fetching blob...');
            const response = await fetch(foundAudio.src);
            console.log('📥 Fetch response:', response.status, response.statusText);
            
            const blob = await response.blob();
            
            console.log('✅ Audio extracted successfully!');
            console.log('📊 Blob details:', {
              size: blob.size,
              type: blob.type,
              sizeKB: (blob.size / 1024).toFixed(2) + ' KB'
            });
            
            // Pause WhatsApp audio to prevent it from playing
            try {
              foundAudio.pause();
              foundAudio.currentTime = 0;
              console.log('⏸️ Audio paused and reset');
            } catch (e) {
              console.log('⚠️ Could not pause audio:', e);
            }
            
            // Click the play button again to return to the initial state
            setTimeout(() => {
              try {
                const pauseButton = container.querySelector('button[aria-label*="Pause"]');
                if (pauseButton) {
                  pauseButton.click();
                  console.log('⏹️ Audio stopped via pause button');
                } else {
                  playButton.click();
                  console.log('🔄 Button restored to initial state');
                }
              } catch (e) {
                console.log('⚠️ Could not restore button state:', e);
              }
            }, 200);
            
            return blob;
          } catch (fetchError) {
            console.error('❌ Error fetching blob:', fetchError);
            console.error('📋 Stack trace:', fetchError.stack);
          }
        } else {
          console.log('⚠️ No audio element detected after clicking and waiting');
          console.log('💡 Trying alternative method...');
        }
      } else {
        console.log('⚠️ Play button not found');
        console.log('🔍 Selectors tried:');
        console.log('  - button[aria-label*="Play voice message"]');
        console.log('  - [aria-label*="Play"]');
        console.log('  - [data-icon="audio-play"]');
      }

      // Fallback method: Search for any existing audio with blob
      console.log('🔍 Searching for existing audios with blob...');
      const allAudioElements = document.querySelectorAll('audio');
      console.log(` Total <audio> elements: ${allAudioElements.length}`);
      
      for (const audioTag of allAudioElements) {
        if (audioTag.src && audioTag.src.startsWith('blob:')) {
          console.log('✅ Audio with blob found:', audioTag.src);
          
          try {
            const response = await fetch(audioTag.src);
            const blob = await response.blob();
            console.log('✅ Audio extracted:', blob.size, 'bytes');
            return blob;
          } catch (error) {
            console.error('❌ Error fetching blob:', error);
          }
        }
      }

      console.log('⚠️ Could not extract audio automatically');
      console.log('💡 Suggestion: Try playing the audio first, then click the transcription button');
      return null;

    } catch (error) {
      console.error('❌ Error extracting audio:', error);
      return null;
    }
  }

  /**
   * Transcribe audio directly without showing dialog
   */
  async function transcribeAudioDirectly(audioBlob, buttonElement, container) {
    try {
      console.log('🎤 Transcribing audio...', audioBlob.size, 'bytes');

      // Create results dialog
      const dialog = createTranscriptionResultDialog(buttonElement);
      document.body.appendChild(dialog);

      const answerDiv = dialog.querySelector('.ai-answer');
      const actions = dialog.querySelector('.ai-actions');
      const loadingDiv = dialog.querySelector('.loading-message');

      // Show loading state
      if (loadingDiv) {
        loadingDiv.style.display = 'block';
      }

      // Transcribe using the multimodal module
      const result = await MultimodalModule.transcribeAudio(
        audioBlob,
        'transcribe',
        (progress) => {
          if (answerDiv) {
            answerDiv.textContent = progress;
          }
        }
      );

      // Hide loading
      if (loadingDiv) {
        loadingDiv.style.display = 'none';
      }

      // Show result
      if (answerDiv) {
        answerDiv.textContent = result;
        answerDiv.style.display = 'block';
      }

      if (actions) {
        actions.style.display = 'flex';
      }

      // Restore button
      buttonElement.innerHTML = `
        <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" fill="none" stroke="white" stroke-width="2"/>
          <text x="12" y="17" text-anchor="middle" font-size="5" fill="white" font-weight="bold">AI</text>
        </svg>
      `;
      buttonElement.disabled = false;

    } catch (error) {
      console.error('Error transcribing:', error);
      alert('Error transcribing audio: ' + error.message);
      buttonElement.disabled = false;
    }
  }

  /**
   * Create simple transcription results dialog
   */
  function createTranscriptionResultDialog(buttonElement) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-whatsapp-dialog';
    dialog.dataset.pinned = 'true';

    // Position the dialog
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const dialogWidth = 520;
      const dialogHeight = 400;

      let left = rect.right + 20;
      let top = rect.top + window.scrollY;

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
    }

    dialog.style.width = 'min(520px, 92vw)';

    dialog.innerHTML = `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="WhatsApp AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">🎤 Audio Transcription</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body" style="padding: 1.5rem;">
        <div class="loading-message" style="text-align: center; padding: 2rem;">
          <div class="ai-spinner" style="margin: 0 auto 1rem; width: 40px; height: 40px;">
            <svg viewBox="0 0 24 24" width="40" height="40">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" fill="none"/>
            </svg>
          </div>
          <p>Transcribing audio...</p>
        </div>
        <div class="ai-answer" style="display: none; min-height: 100px; white-space: pre-wrap;"></div>
      </div>

      <div class="ai-actions" style="display: none;">
        <div class="left">Transcription completed</div>
        <div class="right">
          <button class="ai-iconbtn copy-btn" aria-label="Copy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
          </button>
          <button class="ai-iconbtn insert-btn" aria-label="Insert in chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Configure events
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => dialog.remove());

    const copyBtn = dialog.querySelector('.copy-btn');
    copyBtn?.addEventListener('click', () => {
      const answerDiv = dialog.querySelector('.ai-answer');
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

    const insertBtn = dialog.querySelector('.insert-btn');
    insertBtn?.addEventListener('click', () => {
      const answerDiv = dialog.querySelector('.ai-answer');
      insertTextIntoWhatsApp(answerDiv.textContent);
      dialog.remove();
    });

    DialogModule.enableDrag(dialog);

    return dialog;
  }

  /**
   * Extract context from the last messages of the conversation
   */
  function extractConversationContext(limit = 10) {
    const messages = [];

    // Find the messages area
    const messagesArea = document.querySelector('[data-testid="conversation-panel-messages"]') ||
                        document.querySelector('div[class*="copyable-area"]');

    if (!messagesArea) {
      console.log('⚠️ Messages area not found');
      return messages;
    }

    // Get recent messages
    const messageElements = messagesArea.querySelectorAll('[data-testid="msg-container"]');
    const recentMessages = Array.from(messageElements).slice(-limit);

    recentMessages.forEach(msgEl => {
      // Determine if it's a sent or received message
      const isOutgoing = msgEl.classList.contains('message-out') ||
                        msgEl.querySelector('[data-testid="msg-meta"]')?.textContent?.includes('✓');

      // Extract message text
      const textElement = msgEl.querySelector('span.selectable-text') ||
                         msgEl.querySelector('[data-testid="conversation-text"]');

      if (textElement) {
        const text = textElement.textContent || textElement.innerText;
        messages.push({
          role: isOutgoing ? 'user' : 'assistant',
          content: text.trim()
        });
      }
    });

    console.log(`📝 WhatsApp: ${messages.length} messages extracted`);
    return messages;
  }

  /**
   * Create WhatsApp dialog
   */
  function createWhatsAppDialog(mode, context, buttonElement, audioContainer = null) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-result-panel ai-whatsapp-dialog';
    dialog.dataset.pinned = 'true';
    dialog.dataset.mode = mode;

    // Position the dialog
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const dialogWidth = 520;
      const dialogHeight = mode === 'transcribe' ? 400 : 600;

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

    if (mode === 'transcribe') {
      dialog.innerHTML = createTranscribeDialogHTML();
      setupTranscribeDialog(dialog);
    } else {
      dialog.innerHTML = createComposeDialogHTML(context);
      setupComposeDialog(dialog, context);
    }

    return dialog;
  }

  /**
   * HTML for transcription dialog
   */
  function createTranscribeDialogHTML() {
    const hasCapturedBlobs = capturedAudioBlobs.size > 0;
    const blobInfo = hasCapturedBlobs 
      ? `<div style="background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <strong style="color: #2e7d32;">✅ ${capturedAudioBlobs.size} audio(s) detected in memory</strong>
          <p style="margin: 0.5rem 0 0 0; color: #1b5e20; font-size: 0.9rem;">
            Try clicking the play button first, then click the AI button again.
          </p>
        </div>`
      : `<div style="background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
          <strong style="color: #856404;">⚠️ No audio detected in memory</strong>
          <p style="margin: 0.5rem 0 0 0; color: #856404; font-size: 0.9rem;">
            To capture audio automatically: First click <strong>Play</strong>, then the <strong>AI</strong> button.
          </p>
        </div>`;
    
    return `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="WhatsApp AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">🎤 Transcribe WhatsApp Audio</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body" style="padding: 1.5rem;">
        <div class="ai-whatsapp-transcribe-section">
          ${blobInfo}
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; color: white; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            <div style="display: flex; align-items: start; gap: 1rem;">
              <div style="font-size: 2rem;">💡</div>
              <div>
                <strong style="display: block; font-size: 1.1rem; margin-bottom: 0.5rem;">Tip for automatic capture</strong>
                <p style="margin: 0; font-size: 0.95rem; opacity: 0.95; line-height: 1.5;">
                  1️⃣ Click <strong>"Play"</strong> on the voice message<br>
                  2️⃣ Then click the green <strong>"AI"</strong> button<br>
                  3️⃣ The audio will be transcribed automatically ✨
                </p>
              </div>
            </div>
          </div>

          <div style="background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 8px; padding: 1rem; margin-bottom: 1.5rem;">
            <strong style="color: #2e7d32; display: block; margin-bottom: 0.5rem;">📥 Alternative method - Upload manually:</strong>
            <ol style="margin: 0; padding-left: 1.5rem; color: #1b5e20; line-height: 1.8;">
              <li><strong>Right click</strong> on the voice message</li>
              <li>Select <strong>"Download"</strong></li>
              <li>The file will be saved as <code style="background: rgba(0,0,0,0.1); padding: 2px 6px; border-radius: 4px;">.opus</code></li>
              <li>Upload it using the button below 👇</li>
            </ol>
          </div>

          <div class="transcribe-options" style="display: flex; gap: 1rem; margin-bottom: 1rem;">
            <button class="transcribe-btn upload-btn" data-action="upload" style="flex: 1; padding: 1rem; border: 2px dashed #00a884; background: #f0fdf4; border-radius: 12px; cursor: pointer; transition: all 0.3s; font-size: 1rem; font-weight: 600; color: #00a884; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
              </svg>
              <div>
                <div>📥 Upload downloaded audio</div>
                <small style="font-size: 0.8rem; font-weight: normal; opacity: 0.7;">Formats: .opus, .ogg, .mp3, .m4a</small>
              </div>
            </button>
          </div>
          
          <div style="text-align: center; margin: 1rem 0; color: #999; font-size: 0.9rem;">or</div>
          
          <button class="transcribe-btn record-btn" data-action="record" style="width: 100%; padding: 1rem; border: 2px solid #00a884; background: white; border-radius: 12px; cursor: pointer; transition: all 0.3s; font-size: 1rem; font-weight: 600; color: #00a884; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <circle cx="12" cy="12" r="8"/>
            </svg>
            🎙️ Record new audio from microphone
          </button>
          
          <input type="file" accept="audio/*,.opus" style="display: none;" class="audio-file-input" />

          <div class="audio-player-section" style="display: none; margin-top: 1.5rem; background: #f8f9fa; padding: 1.5rem; border-radius: 12px; border: 1px solid #e0e0e0;">
            <div style="margin-bottom: 1rem;">
              <strong style="display: block; margin-bottom: 0.5rem; color: #333;">🎵 Audio loaded:</strong>
              <audio controls style="width: 100%; margin-bottom: 1rem;"></audio>
            </div>
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; font-weight: 600; color: #555;">Processing mode:</label>
              <select class="transcribe-mode" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; background: white;">
                <option value="transcribe">📝 Transcribe full text</option>
                <option value="summary">📋 Summarize audio content</option>
              </select>
            </div>
            <button class="transcribe-btn process-btn" style="width: 100%; padding: 1rem; background: linear-gradient(135deg, #00a884 0%, #008f6d 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: 0 2px 8px rgba(0, 168, 132, 0.3);">
              ✨ Process audio with AI
            </button>
          </div>

          <div class="transcribe-result" style="margin-top: 1rem; display: none;">
            <div class="ai-answer" style="min-height: 100px; white-space: pre-wrap; background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e0e0e0;"></div>
          </div>
        </div>
      </div>

      <div class="ai-actions" style="display: none;">
        <div class="left">Transcription completed</div>
        <div class="right">
          <button class="ai-iconbtn copy-btn" aria-label="Copy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
          </button>
          <button class="ai-iconbtn insert-btn" aria-label="Insert in chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * HTML for message composition dialog
   */
  function createComposeDialogHTML(context) {
    const contextPreview = context && context.length > 0
      ? `<div class="ai-preview"><strong>Context:</strong><br>${context.slice(-3).map(m => `${m.role === 'user' ? '👤' : '💬'} ${m.content}`).join('<br>')}
</div>`
      : '<div class="ai-preview">No previous context</div>';

    return `
      <header class="ai-result-header ai-draggable">
        <div class="ai-avatar" title="WhatsApp AI">
          <div class="eyes"><span></span><span></span></div>
        </div>
        <div class="title">💬 Generate Response</div>
        <div class="spacer"></div>
        <button class="ai-iconbtn close-panel" aria-label="Close">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </header>

      <div class="ai-result-body">
        ${contextPreview}
        <div class="ai-whatsapp-input-section" style="margin: 1rem 0;">
          <textarea
            class="ai-whatsapp-prompt"
            placeholder="Describe the type of response you want to generate..."
            rows="3"
            style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 8px; font-family: inherit; resize: vertical;"
          ></textarea>
          <button class="ai-btn generate-reply-btn" style="margin-top: 0.5rem; width: 100%;">
            Generate response
          </button>
        </div>
        <div class="ai-answer" style="display: none;"></div>
      </div>

      <div class="ai-actions" style="display: none;">
        <div class="left">Response generated</div>
        <div class="right">
          <button class="ai-iconbtn copy-btn" aria-label="Copy">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
              <rect x="5" y="5" width="10" height="10" rx="2"></rect>
            </svg>
          </button>
          <button class="ai-iconbtn insert-btn" aria-label="Insert in chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          <button class="ai-iconbtn regenerate-btn" aria-label="Regenerate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Configure transcription dialog events
   */
  function setupTranscribeDialog(dialog) {
    const recordBtn = dialog.querySelector('.record-btn');
    const uploadBtn = dialog.querySelector('.upload-btn');
    const fileInput = dialog.querySelector('.audio-file-input');
    const audioPlayer = dialog.querySelector('audio');
    const playerSection = dialog.querySelector('.audio-player-section');
    const processBtn = dialog.querySelector('.process-btn');
    const transcribeMode = dialog.querySelector('.transcribe-mode');
    const resultSection = dialog.querySelector('.transcribe-result');
    const answerDiv = dialog.querySelector('.ai-answer');
    const actions = dialog.querySelector('.ai-actions');

    let currentAudioBlob = null;
    let mediaRecorder = null;
    let recordedChunks = [];

    // Record audio
    recordBtn.addEventListener('click', async () => {
      if (recordBtn.classList.contains('recording')) {
        // Stop recording
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      } else {
        // Start recording
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          recordedChunks = [];

          mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            currentAudioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
            audioPlayer.src = URL.createObjectURL(currentAudioBlob);
            playerSection.style.display = 'block';
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = `
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <circle cx="12" cy="12" r="8"/>
              </svg>
              Record audio
            `;
            stream.getTracks().forEach(t => t.stop());
          };

          mediaRecorder.start(100);
          recordBtn.classList.add('recording');
          recordBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="24" height="24" fill="red">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            Stop
          `;
        } catch (error) {
          console.error('Error accessing microphone:', error);
          alert('Could not access microphone: ' + error.message);
        }
      }
    });

    // Upload file
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    // Hover effects
    uploadBtn.addEventListener('mouseenter', () => {
      uploadBtn.style.background = '#dcfce7';
      uploadBtn.style.transform = 'translateY(-2px)';
      uploadBtn.style.boxShadow = '0 4px 12px rgba(0, 168, 132, 0.2)';
    });
    
    uploadBtn.addEventListener('mouseleave', () => {
      uploadBtn.style.background = '#f0fdf4';
      uploadBtn.style.transform = 'translateY(0)';
      uploadBtn.style.boxShadow = 'none';
    });
    
    recordBtn.addEventListener('mouseenter', () => {
      recordBtn.style.background = '#f0fdf4';
      recordBtn.style.transform = 'translateY(-2px)';
      recordBtn.style.boxShadow = '0 4px 12px rgba(0, 168, 132, 0.2)';
    });
    
    recordBtn.addEventListener('mouseleave', () => {
      recordBtn.style.background = 'white';
      recordBtn.style.transform = 'translateY(0)';
      recordBtn.style.boxShadow = 'none';
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        currentAudioBlob = file;
        audioPlayer.src = URL.createObjectURL(file);
        playerSection.style.display = 'block';
      }
    });

    // Process audio
    processBtn.addEventListener('click', async () => {
      if (!currentAudioBlob) {
        alert('Please record or upload an audio first');
        return;
      }

      try {
        processBtn.disabled = true;
        processBtn.textContent = 'Processing...';
        answerDiv.textContent = '';
        resultSection.style.display = 'block';

        const mode = transcribeMode.value;
        const result = await MultimodalModule.transcribeAudio(
          currentAudioBlob,
          mode,
          (progress) => {
            answerDiv.textContent = progress;
          }
        );

        answerDiv.textContent = result;
        actions.style.display = 'flex';
        processBtn.disabled = false;
        processBtn.textContent = 'Process audio';

      } catch (error) {
        console.error('Error processing audio:', error);
        answerDiv.textContent = `❌ Error: ${error.message}`;
        processBtn.disabled = false;
        processBtn.textContent = 'Process audio';
      }
    });

    // Copy button
    const copyBtn = dialog.querySelector('.copy-btn');
    copyBtn?.addEventListener('click', () => {
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

    // Insert in chat button
    const insertBtn = dialog.querySelector('.insert-btn');
    insertBtn?.addEventListener('click', () => {
      insertTextIntoWhatsApp(answerDiv.textContent);
      dialog.remove();
    });

    // Close dialog
    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      dialog.remove();
    });

    // Drag and drop
    DialogModule.enableDrag(dialog);
  }

  /**
   * Configure composition dialog events
   */
  function setupComposeDialog(dialog, context) {
    const generateBtn = dialog.querySelector('.generate-reply-btn');
    const promptInput = dialog.querySelector('.ai-whatsapp-prompt');
    const answerDiv = dialog.querySelector('.ai-answer');
    const actions = dialog.querySelector('.ai-actions');
    const inputSection = dialog.querySelector('.ai-whatsapp-input-section');

    generateBtn.addEventListener('click', async () => {
      const userPrompt = promptInput.value.trim();

      if (!userPrompt && (!context || context.length === 0)) {
        alert('Please write an instruction or make sure you have conversation context');
        return;
      }

      try {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        answerDiv.textContent = '';
        answerDiv.style.display = 'block';

        // Build prompt with context
        let fullPrompt = '';
        if (context && context.length > 0) {
          fullPrompt += 'Conversation context:\n';
          context.forEach(msg => {
            fullPrompt += `${msg.role === 'user' ? 'Me' : 'Other'}: ${msg.content}\n`;
          });
          fullPrompt += '\n';
        }
        fullPrompt += userPrompt || 'Generate an appropriate response based on the context.';

        const result = await AIModule.aiAnswer(fullPrompt, (progress) => {
          answerDiv.textContent = progress;
        });

        answerDiv.textContent = result;
        actions.style.display = 'flex';
        inputSection.style.display = 'none';
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate response';

      } catch (error) {
        console.error('Error generating response:', error);
        answerDiv.textContent = `❌ Error: ${error.message}`;
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate response';
      }
    });

    // Action buttons
    const copyBtn = dialog.querySelector('.copy-btn');
    copyBtn?.addEventListener('click', () => {
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

    const insertBtn = dialog.querySelector('.insert-btn');
    insertBtn?.addEventListener('click', () => {
      insertTextIntoWhatsApp(answerDiv.textContent);
      dialog.remove();
    });

    const regenerateBtn = dialog.querySelector('.regenerate-btn');
    regenerateBtn?.addEventListener('click', () => {
      inputSection.style.display = 'block';
      actions.style.display = 'none';
      answerDiv.style.display = 'none';
    });

    const closeBtn = dialog.querySelector('.close-panel');
    closeBtn.addEventListener('click', () => {
      dialog.remove();
    });

    // Drag and drop
    DialogModule.enableDrag(dialog);
  }

  /**
   * Insert text into the WhatsApp message field
   */
  function insertTextIntoWhatsApp(text) {
    // Find the editable div of WhatsApp
    const messageInput = document.querySelector('[contenteditable="true"][data-testid="conversation-compose-box-input"]') ||
                        document.querySelector('div[contenteditable="true"][role="textbox"]');

    if (messageInput) {
      // Insert text
      messageInput.focus();

      // Use the native WhatsApp method if available
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);

      const pasteEvent = new ClipboardEvent('paste', {
        clipboardData: dataTransfer,
        bubbles: true,
        cancelable: true
      });

      messageInput.dispatchEvent(pasteEvent);

      // Fallback: insert directly
      if (!messageInput.textContent.includes(text)) {
        messageInput.textContent = text;

        // Trigger input event so WhatsApp detects the change
        const inputEvent = new InputEvent('input', {
          bubbles: true,
          cancelable: true
        });
        messageInput.dispatchEvent(inputEvent);
      }

      console.log('✅ Text inserted in WhatsApp');
    } else {
      console.log('⚠️ Message field not found');
      navigator.clipboard.writeText(text);
      alert('Text copied to clipboard. Paste it in the WhatsApp chat.');
    }
  }

  return {
    init
  };
})();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', WhatsAppModule.init);
} else {
  WhatsAppModule.init();
}

// Expose globally
window.WhatsAppModule = WhatsAppModule;
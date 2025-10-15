const YoutubeModule = (function() {
  let youtubePanel = null;
  let isYoutube = false;
  let currentVideoId = null;

  function init() {
    // Detect if we are on YouTube
    isYoutube = window.location.hostname.includes('youtube.com');
    
    if (isYoutube) {

      observeYoutube();
    }
  }

  function observeYoutube() {
    // Observe URL changes (YouTube is SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        onUrlChange();
      }
    }).observe(document, { subtree: true, childList: true });

    // Verify immediately
    setTimeout(onUrlChange, 1000);
  }

  function onUrlChange() {
    const videoId = getVideoId();
    
    if (videoId && videoId !== currentVideoId) {
      currentVideoId = videoId;

      insertYoutubePanel();
    } else if (!videoId && youtubePanel) {
      removeYoutubePanel();
      currentVideoId = null;
    }
  }

  function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  function insertYoutubePanel() {
    // Remove previous panel if it exists
    removeYoutubePanel();

    // Find the related videos container (secondary)
    const secondary = document.querySelector('#secondary');

    if (!secondary) {

      return;
    }

    // Create summary panel
    youtubePanel = document.createElement('div');
    youtubePanel.className = 'ai-youtube-panel';
    youtubePanel.innerHTML = `
      <div class="ai-youtube-header">
        <div class="ai-youtube-icon">
          <div class="ai-avatar" style="width: 24px; height: 24px; font-size: 12px;">
            <div class="eyes"><span></span><span></span></div>
          </div>
        </div>
        <div class="ai-youtube-title">
          <strong>AI Assistant</strong>
          <span>Video Summary</span>
        </div>
        <button class="ai-youtube-toggle" aria-label="Expand/Collapse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>

      <div class="ai-youtube-content">
        <button class="ai-youtube-summarize-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Generate Video Summary
        </button>

        <div class="ai-youtube-result" style="display: none;">
          <div class="ai-youtube-result-header">
            <span>📋 Video summary:</span>
            <div class="ai-youtube-result-actions">
              <button class="ai-youtube-copy-btn" title="Copy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                  <rect x="5" y="5" width="10" height="10" rx="2"></rect>
                </svg>
              </button>
              <button class="ai-youtube-regenerate-btn" title="Regenerate">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="ai-youtube-result-content"></div>
        </div>
      </div>
    `;

    // Insert the panel at the beginning of secondary
    secondary.insertBefore(youtubePanel, secondary.firstChild);

    setupYoutubePanelEvents(youtubePanel);

    // Auto-click the button to start generating summary automatically
    setTimeout(() => {
      const summarizeBtn = youtubePanel.querySelector('.ai-youtube-summarize-btn');
      if (summarizeBtn) {
        summarizeBtn.click();
      }
    }, 500);
  }

  function removeYoutubePanel() {
    if (youtubePanel) {
      youtubePanel.remove();
      youtubePanel = null;
    }
  }

  function setupYoutubePanelEvents(panel) {
    // Toggle expand/collapse
    const toggleBtn = panel.querySelector('.ai-youtube-toggle');
    const content = panel.querySelector('.ai-youtube-content');
    let isExpanded = true;

    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      content.style.display = isExpanded ? 'block' : 'none';
      toggleBtn.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
    });

    // Generate summary button
    const summarizeBtn = panel.querySelector('.ai-youtube-summarize-btn');
    const resultDiv = panel.querySelector('.ai-youtube-result');
    const resultContent = panel.querySelector('.ai-youtube-result-content');

    summarizeBtn.addEventListener('click', async () => {
      await generateVideoSummary(summarizeBtn, resultDiv, resultContent);
    });

    // Copy button
    const copyBtn = panel.querySelector('.ai-youtube-copy-btn');
    copyBtn.addEventListener('click', () => {
      const text = resultContent.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span style="font-size: 12px;">✓</span>';
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
      });
    });

    // Regenerate button
    const regenerateBtn = panel.querySelector('.ai-youtube-regenerate-btn');
    regenerateBtn.addEventListener('click', async () => {
      await generateVideoSummary(summarizeBtn, resultDiv, resultContent);
    });
  }

  async function generateVideoSummary(btn, resultDiv, resultContent) {
    btn.disabled = true;
    btn.innerHTML = '<span style="opacity: 0.6;">Getting subtitles...</span>';
    resultDiv.style.display = 'none';

    try {
      // Get the video subtitles
      const subtitles = await getVideoSubtitles();

      if (!subtitles || subtitles.length === 0) {
        throw new Error('No subtitles available for this video. The video must have subtitles enabled.');
      }

      btn.innerHTML = '<span style="opacity: 0.6;">Generating summary...</span>';

      // Prepare the subtitle text (optimized for AI)
      let subtitleText = subtitles.map(s => s.text.trim()).join(' ');

      // Clean up the text to reduce size
      subtitleText = subtitleText
        .replace(/\s+/g, ' ')
        .replace(/\[Music\]/gi, '')
        .replace(/\[Applause\]/gi, '')
        .replace(/\[Laughter\]/gi, '')
        .trim();

      console.log(`Prepared transcript: ${subtitleText.length} characters`);

      // Generate the summary using AI
      const summary = await AIModule.aiSummarize(subtitleText, (percent) => {
        btn.innerHTML = `<span style="opacity: 0.6;">Processing ${percent}%</span>`;
      });

      // Render the result
      MarkdownRenderer.renderToElement(resultContent, summary);
      resultDiv.style.display = 'block';

    } catch (error) {
      console.error('Error generating summary:', error);
      resultContent.innerHTML = `
        <div style="color: #ff6b6b; padding: 12px; background: #2a1a1a; border-radius: 6px; border-left: 3px solid #ff6b6b;">
          <strong>❌ Error:</strong> ${error.message}
        </div>
      `;
      resultDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        Generate Video Summary
      `;
    }
  }


  async function getVideoSubtitles() {
    try {
      const videoId = currentVideoId;
      if (!videoId) {
        throw new Error('Could not get video ID');
      }

      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`Fetching transcript for video: ${videoId}`);

      // Call background script directly to fetch transcript via API
      const response = await chrome.runtime.sendMessage({
        action: 'fetchYoutubeTranscript',
        videoUrl: videoUrl
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to fetch transcript from API');
      }

      const data = response.data;

      // Check if transcript is available
      if (!data || !data.transcript || !Array.isArray(data.transcript)) {
        throw new Error('No transcript available for this video');
      }

      console.log(`Successfully fetched ${data.transcript.length} subtitle entries`);

      // Transform to our expected format (start, duration, text)
      return data.transcript.map(item => ({
        start: parseFloat(item.start || item.offset || 0),
        duration: parseFloat(item.duration || item.dur || 0),
        text: item.text || ''
      }));

    } catch (error) {
      console.error('Error in getVideoSubtitles:', error);

      // Provide more helpful error messages
      if (error.message.includes('No transcript available')) {
        throw new Error('This video does not have subtitles available. Please try a video with captions enabled.');
      }

      throw new Error('Could not get subtitles. Make sure the video has available subtitles (manual or automatic). Detail: ' + error.message);
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
    summarizeVideo: async function() {
      const panel = youtubePanel || document.querySelector('.ai-youtube-panel');
      if (panel) {
        const summarizeBtn = panel.querySelector('.ai-youtube-summarize-btn');
        const resultDiv = panel.querySelector('.ai-youtube-result');
        const resultContent = panel.querySelector('.ai-youtube-result-content');
        await generateVideoSummary(summarizeBtn, resultDiv, resultContent);
      } else {
        alert('Please open a YouTube video first');
      }
    }
  };

  // Make globally available
  window.YoutubeModule = publicAPI;

  return publicAPI;
})();



// Creado por David Montero Crespo para WriteBee

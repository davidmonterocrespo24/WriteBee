const FloatButtonModule = (function() {
  let floatButton = null;

  function createFloatButton() {
    if (floatButton) return;

    floatButton = document.createElement('button');
    floatButton.className = 'ai-float-btn';
    floatButton.setAttribute('aria-label', 'Open AI Chat');
    floatButton.innerHTML = `
      <div class="ai-float-mascot" aria-hidden="true">
        <div class="ai-float-mascot-inner">
          <div class="eyes"><span></span><span></span></div>
        </div>
      </div>
      <span class="ai-float-label">Ctrl+M</span>
    `;

    floatButton.addEventListener('click', openSidePanel);
    document.body.appendChild(floatButton);

    document.addEventListener('keydown', handleKeyboard);
  }

  function handleKeyboard(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
      e.preventDefault();
      openSidePanel();
    }
  }

  function openSidePanel() {
    try {
      chrome.runtime.sendMessage({
        action: 'openSidePanel',
        data: null
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('❌ Runtime error:', chrome.runtime.lastError);
          alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue using the chat.');
          return;
        }

        if (response && response.success) {
          console.log('✅ Side panel opened successfully');
        } else {
          console.error('❌ Error opening side panel:', response?.error);
        }
      });
    } catch (error) {
      console.error('❌ Fatal error opening side panel:', error);
      if (error.message.includes('Extension context invalidated')) {
        alert('⚠️ The extension was reloaded.\n\nPlease reload this page (F5) to continue using the chat.');
      } else {
        alert('Error opening chat: ' + error.message);
      }
    }
  }

  function removeFloatButton() {
    if (floatButton) {
      floatButton.remove();
      floatButton = null;
    }
    document.removeEventListener('keydown', handleKeyboard);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createFloatButton);
  } else {
    createFloatButton();
  }

  return {
    createFloatButton,
    removeFloatButton
  };
})();

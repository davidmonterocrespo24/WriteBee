/**
 * Actions Module - Handles AI-powered text actions like summarize, translate, rewrite, etc.
 * @author David Montero Crespo
 * @project WriteBee
 */
const ActionsModule = (function() {
  /**
   * Executes an AI action on selected text and displays results in a dialog
   * @author David Montero Crespo
   */
  async function executeAction(action, param = null, rect = null, selectedText = '') {



    MenusModule.hideMenus();

    const dialog = DialogModule.createDialog(action, '', selectedText, rect);

    document.body.appendChild(dialog);



    if (dialog.adjustPosition) {

      setTimeout(() => {

        dialog.adjustPosition();
      }, 0);
    }

    const answerDiv = dialog.querySelector('.ai-answer');

    if (answerDiv) {
      answerDiv.innerHTML = `
        <div class="ai-typing-indicator">
          <span></span><span></span><span></span>
        </div>
      `;
    }

    const stopBtn = document.createElement('button');
    stopBtn.className = 'ai-stop-btn';
    stopBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
      </svg>
      Stop
    `;

    const header = dialog.querySelector('.ai-result-header');
    const spacer = header.querySelector('.spacer');
    if (spacer) {
      spacer.insertAdjacentElement('afterend', stopBtn);
    }

    const abortController = new AbortController();

    stopBtn.addEventListener('click', () => {
      abortController.abort();
      stopBtn.disabled = true;
      stopBtn.textContent = 'Stopped';
    });

    try {
      let result = '';

      const onChunk = (chunk) => {
        if (answerDiv) {
          MarkdownRenderer.renderToElement(answerDiv, chunk);
        }
      };

      switch (action) {
        case 'summarize':
          result = await AIModule.aiSummarizeStream(selectedText, onChunk, abortController.signal);
          break;
        case 'rewrite':
          result = await AIModule.aiRewriteStream(selectedText, onChunk, abortController.signal);
          break;
        case 'translate':
          // Use aiAnswerStream with a prompt instead of Translator API (may not be available)
          const targetLangMap = {
            'es': 'español',
            'en': 'inglés',
            'fr': 'francés',
            'de': 'alemán',
            'it': 'italiano',
            'pt': 'portugués',
            'ja': 'japonés',
            'zh': 'chino'
          };
          const targetLangCode = param || 'es';
          const targetLangName = targetLangMap[targetLangCode] || targetLangCode;
          const translatePrompt = `Traduce el siguiente texto a ${targetLangName}. Solo proporciona la traducción, sin explicaciones adicionales:\n\n${selectedText}`;
          result = await AIModule.aiAnswerStream(translatePrompt, onChunk, abortController.signal);
          break;
        case 'explain':
          result = await AIModule.aiExplainStream(selectedText, onChunk, abortController.signal);
          break;
        case 'expand':
          result = await AIModule.aiExpandStream(selectedText, onChunk, abortController.signal);
          break;
        case 'answer':
          result = await AIModule.aiAnswerStream(selectedText, onChunk, abortController.signal);
          break;
      }

      stopBtn.remove();
    } catch (error) {
      if (answerDiv) {
        answerDiv.textContent = error.message.includes('cancel')
          ? 'Streaming stopped by user'
          : 'Error: ' + error.message;
      }
      stopBtn.remove();
    }
  }

  return {
    executeAction
  };
})();

// Creado por David Montero Crespo para WriteBee

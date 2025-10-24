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

    // Save the active element and selection BEFORE doing anything else (for grammar check)
    const originalActiveElement = document.activeElement;
    const originalSelection = window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).cloneRange() : null;

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
      let grammarResult = null;

      const onChunk = (chunk) => {
        if (answerDiv) {
          // Check for grammar check spinner keyword
          if (chunk === '__GRAMMAR_ANALYZING__') {
            answerDiv.innerHTML = `
              <div class="ai-typing-indicator">
                <span></span><span></span><span></span>
              </div>
            `;
            return;
          }
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
        case 'grammar-check':
          // Save the active element and selection BEFORE opening dialog
          const activeElement = document.activeElement;
          const savedSelection = window.getSelection().rangeCount > 0 ? window.getSelection().getRangeAt(0).cloneRange() : null;

          grammarResult = await AIModule.aiGrammarCheckStream(selectedText, onChunk, abortController.signal);
          result = grammarResult.output;

          // Add Replace All button if there are errors
          if (grammarResult.hasErrors) {
            const replaceAllBtn = document.createElement('button');
            replaceAllBtn.className = 'ai-replace-all-btn';
            replaceAllBtn.innerHTML = `
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:4px;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Replace All
            `;
            replaceAllBtn.addEventListener('click', () => {
              let replaced = false;

              // Try to replace in the original element
              try {
                // For input/textarea elements
                if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
                  const start = activeElement.selectionStart;
                  const end = activeElement.selectionEnd;
                  const currentValue = activeElement.value;

                  activeElement.value = currentValue.substring(0, start) + grammarResult.correctedText + currentValue.substring(end);
                  activeElement.selectionStart = activeElement.selectionEnd = start + grammarResult.correctedText.length;

                  // Trigger input event
                  activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                  replaced = true;
                }
                // For contenteditable elements
                else if (savedSelection) {
                  const selection = window.getSelection();
                  selection.removeAllRanges();
                  selection.addRange(savedSelection);

                  savedSelection.deleteContents();
                  const textNode = document.createTextNode(grammarResult.correctedText);
                  savedSelection.insertNode(textNode);

                  savedSelection.setStartAfter(textNode);
                  savedSelection.setEndAfter(textNode);
                  selection.removeAllRanges();
                  selection.addRange(savedSelection);

                  replaced = true;
                }
              } catch (error) {
                console.log('Could not replace text:', error);
              }

              // Copy to clipboard
              navigator.clipboard.writeText(grammarResult.correctedText).then(() => {
                replaceAllBtn.innerHTML = `
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px;height:16px;margin-right:4px;">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  ${replaced ? 'Replaced!' : 'Copied!'}
                `;
                replaceAllBtn.disabled = true;

                setTimeout(() => {
                  dialog.remove();
                }, 1500);
              });
            });

            // Insert button in header after spacer
            const header = dialog.querySelector('.ai-result-header');
            const spacer = header.querySelector('.spacer');
            if (spacer) {
              spacer.insertAdjacentElement('afterend', replaceAllBtn);
            }
          }
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

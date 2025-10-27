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

    // Get the saved selection info from ToolbarModule (captured when toolbar was shown)
    const selectionInfo = ToolbarModule.getSavedSelectionInfo();
    const originalActiveElement = selectionInfo.activeElement;
    const originalSelection = selectionInfo.selection;
    const savedSelectionStart = selectionInfo.selectionStart;
    const savedSelectionEnd = selectionInfo.selectionEnd;

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
                if (originalActiveElement && (originalActiveElement.tagName === 'TEXTAREA' || originalActiveElement.tagName === 'INPUT')) {
                  const currentValue = originalActiveElement.value;

                  // Use saved selection positions
                  originalActiveElement.value = currentValue.substring(0, savedSelectionStart) + grammarResult.correctedText + currentValue.substring(savedSelectionEnd);

                  // Set cursor position after replaced text
                  const newPosition = savedSelectionStart + grammarResult.correctedText.length;
                  originalActiveElement.selectionStart = newPosition;
                  originalActiveElement.selectionEnd = newPosition;

                  // Focus the element
                  originalActiveElement.focus();

                  // Trigger input event
                  originalActiveElement.dispatchEvent(new Event('input', { bubbles: true }));
                  replaced = true;
                }
                // For contenteditable elements
                else if (originalSelection) {
                  const selection = window.getSelection();
                  selection.removeAllRanges();
                  selection.addRange(originalSelection);

                  originalSelection.deleteContents();
                  const textNode = document.createTextNode(grammarResult.correctedText);
                  originalSelection.insertNode(textNode);

                  originalSelection.setStartAfter(textNode);
                  originalSelection.setEndAfter(textNode);
                  selection.removeAllRanges();
                  selection.addRange(originalSelection);

                  replaced = true;
                }
              } catch (error) {
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

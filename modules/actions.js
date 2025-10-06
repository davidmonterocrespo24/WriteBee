const ActionsModule = (function() {
  async function executeAction(action, param = null, rect = null, selectedText = '') {
    console.log('⚙️⚙️⚙️ executeAction LLAMADO ⚙️⚙️⚙️');
    console.log('⚙️ executeAction - acción:', action, 'param:', param);
    console.log('⚙️ executeAction - rect recibido:', rect);
    MenusModule.hideMenus();

    // Crear el diálogo inmediatamente con typing indicator
    console.log('📊 Creando diálogo con typing indicator');
    const dialog = DialogModule.createDialog(action, '', selectedText, rect);
    console.log('📊 Dialog creado, agregándolo al DOM...');
    document.body.appendChild(dialog);
    console.log('✅ Diálogo agregado al DOM');
    console.log('📊 Posición del diálogo después de agregar al DOM:', {
      left: dialog.style.left,
      top: dialog.style.top,
      boundingRect: dialog.getBoundingClientRect()
    });

    // Ajustar posición después de agregar al DOM
    if (dialog.adjustPosition) {
      console.log('🔄 Llamando a dialog.adjustPosition()...');
      setTimeout(() => {
        console.log('⏰ setTimeout ejecutado, llamando adjustPosition ahora');
        dialog.adjustPosition();
      }, 0);
    }

    // Obtener el div de respuesta para actualizarlo
    const answerDiv = dialog.querySelector('.ai-answer');

    // Crear typing indicator
    if (answerDiv) {
      answerDiv.innerHTML = `
        <div class="ai-typing-indicator">
          <span></span><span></span><span></span>
        </div>
      `;
    }

    // Crear botón detener
    const stopBtn = document.createElement('button');
    stopBtn.className = 'ai-stop-btn';
    stopBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
        <rect x="6" y="6" width="12" height="12" rx="2"/>
      </svg>
      Detener
    `;

    // Insertar botón detener en el header
    const header = dialog.querySelector('.ai-result-header');
    const spacer = header.querySelector('.spacer');
    if (spacer) {
      spacer.insertAdjacentElement('afterend', stopBtn);
    }

    // AbortController para cancelar streaming
    const abortController = new AbortController();

    stopBtn.addEventListener('click', () => {
      abortController.abort();
      stopBtn.disabled = true;
      stopBtn.textContent = 'Detenido';
    });

    try {
      let result = '';

      // Función de callback para streaming
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
          result = await AIModule.aiTranslateStream(selectedText, param || 'es', onChunk, abortController.signal);
          break;
        case 'explain':
          result = await AIModule.aiExplainStream(selectedText, onChunk, abortController.signal);
          break;
        case 'grammar':
          // No streaming disponible - usar implementación existente
          result = await AIModule.aiGrammar(selectedText);
          if (answerDiv) MarkdownRenderer.renderToElement(answerDiv, result);
          break;
        case 'expand':
          result = await AIModule.aiExpandStream(selectedText, onChunk, abortController.signal);
          break;
        case 'answer':
          result = await AIModule.aiAnswerStream(selectedText, onChunk, abortController.signal);
          break;
      }

      // Remover botón detener
      stopBtn.remove();
    } catch (error) {
      // Actualizar el contenido del diálogo con el error
      if (answerDiv) {
        answerDiv.textContent = error.message.includes('cancelado')
          ? 'Streaming detenido por el usuario'
          : 'Error: ' + error.message;
      }
      stopBtn.remove();
    }
  }

  return {
    executeAction
  };
})();

const ActionsModule = (function() {
  async function executeAction(action, param = null, rect = null, selectedText = '') {
    console.log('⚙️ executeAction - acción:', action, 'param:', param);
    MenusModule.hideMenus();

    // Crear el diálogo inmediatamente con mensaje "Procesando..."
    console.log('📊 Creando diálogo con mensaje de procesando');
    const dialog = DialogModule.createDialog(action, 'Procesando...', selectedText, rect);
    document.body.appendChild(dialog);
    console.log('✅ Diálogo agregado al DOM');

    // Ajustar posición después de agregar al DOM
    if (dialog.adjustPosition) {
      setTimeout(() => dialog.adjustPosition(), 0);
    }

    // Obtener el div de respuesta para actualizarlo
    const answerDiv = dialog.querySelector('.ai-answer');

    // Callback para actualizar el progreso de descarga
    const onProgress = (percent) => {
      if (answerDiv) {
        answerDiv.textContent = `Procesando ${percent}%`;
      }
    };

    try {
      let result = '';

      switch (action) {
        case 'summarize':
          result = await AIModule.aiSummarize(selectedText, onProgress);
          break;
        case 'translate':
          result = await AIModule.aiTranslate(selectedText, param || 'es', onProgress);
          break;
        case 'explain':
          result = await AIModule.aiExplain(selectedText, onProgress);
          break;
        case 'grammar':
          result = await AIModule.aiGrammar(selectedText, onProgress);
          break;
        case 'rewrite':
          result = await AIModule.aiRewrite(selectedText, onProgress);
          break;
        case 'expand':
          result = await AIModule.aiExpand(selectedText, onProgress);
          break;
        case 'answer':
          result = await AIModule.aiAnswer(selectedText, onProgress);
          break;
      }

      // Actualizar el contenido del diálogo con el resultado (renderizado en Markdown)
      if (answerDiv) {
        MarkdownRenderer.renderToElement(answerDiv, result);
      }
    } catch (error) {
      // Actualizar el contenido del diálogo con el error
      if (answerDiv) {
        answerDiv.textContent = 'Error: ' + error.message;
      }
    }
  }

  return {
    executeAction
  };
})();

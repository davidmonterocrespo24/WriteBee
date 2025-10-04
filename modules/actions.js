const ActionsModule = (function() {
  async function executeAction(action, param = null, rect = null, selectedText = '') {
    console.log('⚙️ executeAction - acción:', action, 'param:', param);
    MenusModule.hideMenus();

    const loadingDialog = DialogModule.showLoadingDialog(rect);

    // Callback para actualizar el progreso de descarga
    const onProgress = (percent) => {
      if (loadingDialog && loadingDialog.updateProgress) {
        loadingDialog.updateProgress(percent);
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

      loadingDialog.remove();
      console.log('📊 Creando diálogo con resultado');
      const dialog = DialogModule.createDialog(action, result, selectedText, rect);
      document.body.appendChild(dialog);
      console.log('✅ Diálogo agregado al DOM');
      // Ajustar posición después de agregar al DOM
      if (dialog.adjustPosition) {
        setTimeout(() => dialog.adjustPosition(), 0);
      }
    } catch (error) {
      loadingDialog.remove();
      const dialog = DialogModule.createDialog(action, 'Error: ' + error.message, selectedText, rect);
      document.body.appendChild(dialog);
      // Ajustar posición después de agregar al DOM
      if (dialog.adjustPosition) {
        setTimeout(() => dialog.adjustPosition(), 0);
      }
    }
  }

  return {
    executeAction
  };
})();

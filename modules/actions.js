const ActionsModule = (function() {
  async function executeAction(action, param = null, rect = null, selectedText = '') {
    console.log('⚙️ executeAction - acción:', action, 'param:', param);
    MenusModule.hideMenus();

    const loadingDialog = DialogModule.showLoadingDialog(rect);

    try {
      let result = '';

      switch (action) {
        case 'summarize':
          result = await AIModule.aiSummarize(selectedText);
          break;
        case 'translate':
          result = await AIModule.aiTranslate(selectedText, param || 'es');
          break;
        case 'explain':
          result = await AIModule.aiExplain(selectedText);
          break;
        case 'grammar':
          result = await AIModule.aiGrammar(selectedText);
          break;
        case 'rewrite':
          result = await AIModule.aiRewrite(selectedText);
          break;
        case 'expand':
          result = await AIModule.aiExpand(selectedText);
          break;
        case 'answer':
          result = await AIModule.aiAnswer(selectedText);
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

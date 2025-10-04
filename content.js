let ignoreNextMouseUp = false;

document.addEventListener('mouseup', handleTextSelection);
document.addEventListener('mousedown', handleClickOutside);

function handleTextSelection(e) {
  console.log('🔵 handleTextSelection - ignoreNextMouseUp:', ignoreNextMouseUp);

  // Si se activó la bandera de ignorar, resetearla y salir
  if (ignoreNextMouseUp) {
    console.log('✅ Ignorando mouseup');
    ignoreNextMouseUp = false;
    return;
  }

  setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    console.log('📝 Texto seleccionado:', text);

    // Verificar si la selección está dentro de un diálogo
    const allDialogs = document.querySelectorAll('.ai-result-panel');
    let isInsideDialog = false;
    allDialogs.forEach(dialog => {
      if (dialog.contains(e.target)) {
        isInsideDialog = true;
      }
    });

    console.log('📦 Diálogos encontrados:', allDialogs.length, '- Click dentro:', isInsideDialog);

    // Verificar si el click fue en el menú o toolbar
    const menu = MenusModule.getMenu();
    const toolbar = ToolbarModule.getToolbar();
    const isInsideMenu = menu && menu.contains(e.target);
    const isInsideToolbar = toolbar && toolbar.contains(e.target);

    console.log('🔧 Menu existe:', !!menu, '- Click dentro:', isInsideMenu);
    console.log('🔧 Toolbar existe:', !!toolbar, '- Click dentro:', isInsideToolbar);

    // Si la selección está dentro de un diálogo, menú o toolbar, no hacer nada
    if (isInsideDialog || isInsideMenu || isInsideToolbar) {
      console.log('⏸️ Saliendo - click dentro de UI');
      return;
    }

    if (text.length > 0) {
      console.log('✨ Mostrando toolbar');
      ToolbarModule.showToolbar(e.pageX, e.pageY, text);
    } else {
      console.log('❌ Ocultando todo');
      hideAll();
    }
  }, 10);
}

function setIgnoreNextMouseUp() {
  ignoreNextMouseUp = true;
}

// Exponer función globalmente para que los módulos puedan usarla
window.setIgnoreNextMouseUp = setIgnoreNextMouseUp;

function handleClickOutside(e) {
  const toolbar = ToolbarModule.getToolbar();
  const menu = MenusModule.getMenu();
  const translateMenu = MenusModule.getTranslateMenu();

  // Verificar si el click fue en algún diálogo (pinned o no pinned)
  const allDialogs = document.querySelectorAll('.ai-result-panel');
  let clickedInsideDialog = false;
  allDialogs.forEach(dialog => {
    if (dialog.contains(e.target)) {
      clickedInsideDialog = true;
    }
  });

  // Si el click fue dentro de algún diálogo, no hacer nada
  if (clickedInsideDialog) {
    return;
  }

  // Si el click fue fuera de toolbar, menús y diálogos, ocultar todo
  if ((!toolbar || !toolbar.contains(e.target)) &&
      (!menu || !menu.contains(e.target)) &&
      (!translateMenu || !translateMenu.contains(e.target))) {
    hideAll();
  }
}

function hideAll() {
  console.log('🗑️ hideAll - ocultando toolbar y diálogo actual');
  ToolbarModule.hideToolbar();
  const currentDialog = DialogModule.getCurrentDialog();
  if (currentDialog) {
    console.log('🗑️ Eliminando diálogo actual');
    currentDialog.remove();
  }
}

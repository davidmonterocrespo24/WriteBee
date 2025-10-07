const ToolbarSettingsModule = (function() {
  let settingsPanel = null;
  let draggedItem = null;

  async function showSettings(button) {
    if (settingsPanel) settingsPanel.remove();

    const rect = button.getBoundingClientRect();
    settingsPanel = document.createElement('div');
    settingsPanel.className = 'ai-toolbar-settings';
    settingsPanel.style.left = (rect.left + window.scrollX) + 'px';
    settingsPanel.style.top = (rect.bottom + window.scrollY + 5) + 'px';

    const config = await ToolbarConfigModule.loadConfig();

    settingsPanel.innerHTML = `
      <div class="toolbar-settings-header">
        <h3>Toolbar Settings</h3>
        <button class="close-btn" aria-label="Close">×</button>
      </div>
      <div class="toolbar-settings-body">
        <p class="settings-hint">Drag to reorder • Click 📌 to pin/unpin</p>
        <div class="actions-list" id="toolbar-actions-list">
          ${renderActionsList(config)}
        </div>
      </div>
      <div class="toolbar-settings-footer">
        <button class="reset-btn">Reset to defaults</button>
      </div>
    `;

    document.body.appendChild(settingsPanel);

    // Event listeners
    setupEventListeners();
  }

  function renderActionsList(config) {
    return config.map((action, index) => `
      <div class="action-item ${action.pinned ? 'pinned' : ''}"
           data-action-id="${action.id}"
           data-index="${index}"
           draggable="true">
        <div class="drag-handle">☰</div>
        <div class="action-info">
          <div class="action-icon">${action.icon}</div>
          <div class="action-label">${action.label}</div>
        </div>
        <button class="pin-btn" data-action-id="${action.id}" aria-label="${action.pinned ? 'Unpin' : 'Pin'}">
          ${action.pinned ? '📌' : '📍'}
        </button>
      </div>
    `).join('');
  }

  function setupEventListeners() {
    // Close button
    const closeBtn = settingsPanel.querySelector('.close-btn');
    closeBtn.addEventListener('click', hideSettings);

    // Reset button
    const resetBtn = settingsPanel.querySelector('.reset-btn');
    resetBtn.addEventListener('click', async () => {
      await ToolbarConfigModule.resetToDefaults();
      await refreshSettingsList();
    });

    // Pin/unpin buttons
    const pinBtns = settingsPanel.querySelectorAll('.pin-btn');
    pinBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const actionId = btn.dataset.actionId;
        const newPinStatus = await ToolbarConfigModule.togglePin(actionId);
        await refreshSettingsList();
      });
    });

    // Drag and drop
    const actionItems = settingsPanel.querySelectorAll('.action-item');
    actionItems.forEach(item => {
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);
    });
  }

  function handleDragStart(e) {
    draggedItem = e.currentTarget;
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  }

  function handleDragOver(e) {
    if (e.preventDefault) {
      e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';

    const target = e.currentTarget;
    if (target !== draggedItem && target.classList.contains('action-item')) {
      const rect = target.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;

      if (e.clientY < midY) {
        target.parentNode.insertBefore(draggedItem, target);
      } else {
        target.parentNode.insertBefore(draggedItem, target.nextSibling);
      }
    }

    return false;
  }

  function handleDrop(e) {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    return false;
  }

  async function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');

    // Get new order
    const actionsList = settingsPanel.querySelector('#toolbar-actions-list');
    const items = Array.from(actionsList.querySelectorAll('.action-item'));
    const newOrder = items.map(item => item.dataset.actionId);

    // Save new order
    await ToolbarConfigModule.reorderActions(newOrder);

    draggedItem = null;
  }

  async function refreshSettingsList() {
    const config = await ToolbarConfigModule.loadConfig();
    const actionsList = settingsPanel.querySelector('#toolbar-actions-list');
    actionsList.innerHTML = renderActionsList(config);
    setupEventListeners();
  }

  function hideSettings() {
    if (settingsPanel) {
      settingsPanel.remove();
      settingsPanel = null;
    }
  }

  function getSettingsPanel() {
    return settingsPanel;
  }

  return {
    showSettings,
    hideSettings,
    getSettingsPanel
  };
})();

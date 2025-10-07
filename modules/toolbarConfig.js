const ToolbarConfigModule = (function() {
  const STORAGE_KEY = 'ai-toolbar-config';

  // Default actions with their properties
  const DEFAULT_ACTIONS = [
    {
      id: 'rewrite',
      icon: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 17.25V21h3.75L18.81 8.94l-3.75-3.75L3 17.25zm2.92 2.33h-.5v-.5l9.9-9.9.5.5-9.9 9.9zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75 1.13-1.13z"/></svg>`,
      label: 'Rewrite',
      pinned: true,
      className: 'pen'
    },
    {
      id: 'summarize',
      icon: `<svg class="doc" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6"/><path d="M8 12h8M8 16h8"/></svg>`,
      label: 'Summarize',
      pinned: true
    },
    {
      id: 'translate',
      icon: `<svg class="translate" viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h9"/><path d="M8 5s.3 5-4 9"/><path d="M12 9h-8"/><path d="M14 19l4-10 4 10"/><path d="M15.5 15h5"/></svg>`,
      label: 'Translate',
      pinned: true,
      className: 'has-caret'
    },
    {
      id: 'chat-with-page',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><circle cx="9" cy="10" r="1"/><circle cx="12" cy="10" r="1"/><circle cx="15" cy="10" r="1"/></svg>`,
      label: 'Chat with this page',
      pinned: true
    },
    {
      id: 'explain',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      label: 'Explain',
      pinned: false
    },
    {
      id: 'grammar',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M9 6h6"/><path d="M9 10h6"/><path d="M9 14h3"/></svg>`,
      label: 'Grammar',
      pinned: false
    },
    {
      id: 'expand',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
      label: 'Expand',
      pinned: false
    },
    {
      id: 'answer',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
      label: 'Answer',
      pinned: false
    }
  ];

  // Load configuration from storage
  async function loadConfig() {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      if (result[STORAGE_KEY]) {
        return result[STORAGE_KEY];
      }
      return DEFAULT_ACTIONS;
    } catch (error) {
      console.error('Error loading toolbar config:', error);
      return DEFAULT_ACTIONS;
    }
  }

  // Save configuration to storage
  async function saveConfig(config) {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: config });
      return true;
    } catch (error) {
      console.error('Error saving toolbar config:', error);
      return false;
    }
  }

  // Get pinned actions
  async function getPinnedActions() {
    const config = await loadConfig();
    return config.filter(action => action.pinned);
  }

  // Get unpinned actions
  async function getUnpinnedActions() {
    const config = await loadConfig();
    return config.filter(action => !action.pinned);
  }

  // Toggle pin status of an action
  async function togglePin(actionId) {
    const config = await loadConfig();
    const action = config.find(a => a.id === actionId);
    if (action) {
      action.pinned = !action.pinned;
      await saveConfig(config);
      return action.pinned;
    }
    return null;
  }

  // Reorder actions
  async function reorderActions(newOrder) {
    const config = await loadConfig();
    const reordered = newOrder.map(id => config.find(a => a.id === id)).filter(Boolean);
    // Add any missing actions at the end
    const missing = config.filter(a => !newOrder.includes(a.id));
    const finalConfig = [...reordered, ...missing];
    await saveConfig(finalConfig);
    return finalConfig;
  }

  // Reset to defaults
  async function resetToDefaults() {
    await saveConfig(DEFAULT_ACTIONS);
    return DEFAULT_ACTIONS;
  }

  // Get action by ID
  async function getAction(actionId) {
    const config = await loadConfig();
    return config.find(a => a.id === actionId);
  }

  return {
    loadConfig,
    saveConfig,
    getPinnedActions,
    getUnpinnedActions,
    togglePin,
    reorderActions,
    resetToDefaults,
    getAction
  };
})();

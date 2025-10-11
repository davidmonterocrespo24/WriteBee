const PromptLibraryModule = (function() {
  let prompts = [];
  const STORAGE_KEY = 'ai_prompt_library';

  /**
   * Load prompts from storage
   */
  async function loadPrompts() {
    try {
      const result = await chrome.storage.local.get([STORAGE_KEY]);
      prompts = result[STORAGE_KEY] || getDefaultPrompts();
      return prompts;
    } catch (error) {
      console.error('Error loading prompts:', error);
      prompts = getDefaultPrompts();
      return prompts;
    }
  }

  /**
   * Save prompts to storage
   */
  async function savePrompts() {
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: prompts });
      return true;
    } catch (error) {
      console.error('Error saving prompts:', error);
      return false;
    }
  }

  /**
   * Get default prompts
   */
  function getDefaultPrompts() {
    return [
      {
        id: 'summarize',
        name: 'Summarize',
        icon: '📄',
        prompt: 'Summarize the following text in a clear and concise way:',
        category: 'text'
      },
      {
        id: 'translate',
        name: 'Translate',
        icon: '🌐',
        prompt: 'Translate the following text to {language}:',
        category: 'text'
      },
      {
        id: 'explain',
        name: 'Explain',
        icon: '💡',
        prompt: 'Explain the following text in simple terms:',
        category: 'text'
      },
      {
        id: 'professional',
        name: 'Make Professional',
        icon: '💼',
        prompt: 'Rewrite the following text in a professional tone:',
        category: 'writing'
      },
      {
        id: 'casual',
        name: 'Make Casual',
        icon: '😊',
        prompt: 'Rewrite the following text in a casual, friendly tone:',
        category: 'writing'
      },
      {
        id: 'email',
        name: 'Write Email',
        icon: '📧',
        prompt: 'Write a professional email based on the following points:',
        category: 'writing'
      },
      {
        id: 'bullet-points',
        name: 'To Bullet Points',
        icon: '•',
        prompt: 'Convert the following text into clear bullet points:',
        category: 'formatting'
      },
      {
        id: 'expand',
        name: 'Expand',
        icon: '🔍',
        prompt: 'Expand on the following text with more details and examples:',
        category: 'text'
      },
      {
        id: 'simplify',
        name: 'Simplify',
        icon: '✨',
        prompt: 'Simplify the following text to make it easier to understand:',
        category: 'text'
      }
    ];
  }

  /**
   * Add custom prompt
   */
  async function addPrompt(name, prompt, icon = '💬', category = 'custom') {
    const newPrompt = {
      id: 'custom_' + Date.now(),
      name,
      icon,
      prompt,
      category,
      custom: true
    };

    prompts.push(newPrompt);
    await savePrompts();
    return newPrompt;
  }

  /**
   * Edit prompt
   */
  async function editPrompt(id, updates) {
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts[index] = { ...prompts[index], ...updates };
      await savePrompts();
      return prompts[index];
    }
    return null;
  }

  /**
   * Delete prompt
   */
  async function deletePrompt(id) {
    const index = prompts.findIndex(p => p.id === id);
    if (index !== -1) {
      prompts.splice(index, 1);
      await savePrompts();
      return true;
    }
    return false;
  }

  /**
   * Get all prompts
   */
  function getAllPrompts() {
    return prompts;
  }

  /**
   * Get prompts by category
   */
  function getPromptsByCategory(category) {
    return prompts.filter(p => p.category === category);
  }

  /**
   * Search prompts
   */
  function searchPrompts(query) {
    const lowerQuery = query.toLowerCase();
    return prompts.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.prompt.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Execute prompt with text
   */
  async function executePrompt(promptId, text, params = {}) {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) {
      throw new Error('Prompt not found');
    }

    // Replace parameters in prompt
    let finalPrompt = prompt.prompt;
    Object.keys(params).forEach(key => {
      finalPrompt = finalPrompt.replace(`{${key}}`, params[key]);
    });

    // Add text to prompt
    finalPrompt += '\n\n' + text;

    // Execute with AI
    return await AIModule.aiPrompt(finalPrompt);
  }

  /**
   * Create prompt picker UI
   */
  function createPromptPicker(onSelect, position = null) {
    const picker = document.createElement('div');
    picker.className = 'ai-prompt-picker';

    if (position) {
      picker.style.left = position.x + 'px';
      picker.style.top = position.y + 'px';
    }

    const categories = [...new Set(prompts.map(p => p.category))];

    picker.innerHTML = `
      <div class="ai-prompt-picker-header">
        <input type="text" class="ai-prompt-search" placeholder="Search prompts..." />
      </div>
      <div class="ai-prompt-picker-body">
        ${categories.map(cat => `
          <div class="ai-prompt-category">
            <div class="ai-prompt-category-title">${cat}</div>
            ${getPromptsByCategory(cat).map(p => `
              <div class="ai-prompt-item" data-id="${p.id}">
                <span class="ai-prompt-icon">${p.icon}</span>
                <span class="ai-prompt-name">${p.name}</span>
                ${p.custom ? '<button class="ai-prompt-delete" data-id="' + p.id + '">×</button>' : ''}
              </div>
            `).join('')}
          </div>
        `).join('')}
      </div>
      <div class="ai-prompt-picker-footer">
        <button class="ai-btn-add-prompt">+ Add Custom Prompt</button>
      </div>
    `;

    // Setup events
    const searchInput = picker.querySelector('.ai-prompt-search');
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      if (query.length > 0) {
        const results = searchPrompts(query);
        updatePickerResults(picker, results);
      } else {
        updatePickerCategories(picker);
      }
    });

    picker.querySelectorAll('.ai-prompt-item').forEach(item => {
      item.addEventListener('click', () => {
        const promptId = item.dataset.id;
        const prompt = prompts.find(p => p.id === promptId);
        if (prompt && onSelect) {
          onSelect(prompt);
          picker.remove();
        }
      });
    });

    picker.querySelectorAll('.ai-prompt-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const promptId = btn.dataset.id;
        if (confirm('Delete this prompt?')) {
          await deletePrompt(promptId);
          updatePickerCategories(picker);
        }
      });
    });

    picker.querySelector('.ai-btn-add-prompt')?.addEventListener('click', () => {
      showAddPromptDialog(picker);
    });

    return picker;
  }

  /**
   * Update picker with search results
   */
  function updatePickerResults(picker, results) {
    const body = picker.querySelector('.ai-prompt-picker-body');
    body.innerHTML = results.map(p => `
      <div class="ai-prompt-item" data-id="${p.id}">
        <span class="ai-prompt-icon">${p.icon}</span>
        <span class="ai-prompt-name">${p.name}</span>
        ${p.custom ? '<button class="ai-prompt-delete" data-id="' + p.id + '">×</button>' : ''}
      </div>
    `).join('');
  }

  /**
   * Update picker with categories
   */
  function updatePickerCategories(picker) {
    const categories = [...new Set(prompts.map(p => p.category))];
    const body = picker.querySelector('.ai-prompt-picker-body');
    body.innerHTML = categories.map(cat => `
      <div class="ai-prompt-category">
        <div class="ai-prompt-category-title">${cat}</div>
        ${getPromptsByCategory(cat).map(p => `
          <div class="ai-prompt-item" data-id="${p.id}">
            <span class="ai-prompt-icon">${p.icon}</span>
            <span class="ai-prompt-name">${p.name}</span>
            ${p.custom ? '<button class="ai-prompt-delete" data-id="' + p.id + '">×</button>' : ''}
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  /**
   * Show add prompt dialog
   */
  function showAddPromptDialog(parentElement) {
    const dialog = document.createElement('div');
    dialog.className = 'ai-add-prompt-dialog';
    dialog.innerHTML = `
      <h3>Add Custom Prompt</h3>
      <input type="text" class="ai-input" placeholder="Prompt Name" id="prompt-name" />
      <input type="text" class="ai-input" placeholder="Icon (emoji)" id="prompt-icon" maxlength="2" />
      <select class="ai-input" id="prompt-category">
        <option value="custom">Custom</option>
        <option value="text">Text</option>
        <option value="writing">Writing</option>
        <option value="formatting">Formatting</option>
      </select>
      <textarea class="ai-input" placeholder="Prompt template (use {variable} for parameters)" id="prompt-text" rows="4"></textarea>
      <div class="ai-dialog-buttons">
        <button class="ai-btn-cancel">Cancel</button>
        <button class="ai-btn-save">Save</button>
      </div>
    `;

    parentElement.appendChild(dialog);

    dialog.querySelector('.ai-btn-cancel').addEventListener('click', () => {
      dialog.remove();
    });

    dialog.querySelector('.ai-btn-save').addEventListener('click', async () => {
      const name = dialog.querySelector('#prompt-name').value.trim();
      const icon = dialog.querySelector('#prompt-icon').value.trim() || '💬';
      const category = dialog.querySelector('#prompt-category').value;
      const text = dialog.querySelector('#prompt-text').value.trim();

      if (name && text) {
        await addPrompt(name, text, icon, category);
        updatePickerCategories(parentElement);
        dialog.remove();
      }
    });
  }

  // Initialize on load
  loadPrompts();

  return {
    loadPrompts,
    savePrompts,
    addPrompt,
    editPrompt,
    deletePrompt,
    getAllPrompts,
    getPromptsByCategory,
    searchPrompts,
    executePrompt,
    createPromptPicker
  };
})();

// Expose globally
window.PromptLibraryModule = PromptLibraryModule;



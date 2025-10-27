/**
 * Grammar Checker Module - Real-time grammar checking for input fields and textareas
 * @author David Montero Crespo
 * @project WriteBee
 * @description Provides inline grammar checking with interactive corrections
 */

const GrammarChecker = (function() {

  let activePopover = null;
  let currentCorrections = new Map(); // Map of element -> corrections
  let debounceTimers = new Map();
  const DEBOUNCE_DELAY = 1500; // Wait 1.5s after user stops typing

  /**
   * Initialize grammar checking for an input/textarea element
   */
  function attachToElement(element) {

    if (!element || element.dataset.grammarCheckerAttached === 'true') {
      return;
    }

    element.dataset.grammarCheckerAttached = 'true';

    // Create wrapper for positioning
    const wrapper = createWrapper(element);

    // Create overlay for highlighting
    const overlay = createOverlay(element);
    wrapper.appendChild(overlay);

    // Store references
    element.dataset.grammarOverlay = overlay.id;

    // Listen for input changes
    element.addEventListener('input', () => {
      handleInput(element, overlay);
    });

    // Listen for clicks to show suggestions
    element.addEventListener('click', (e) => {
      handleClick(element, e);
    });

    // Clean up on blur after delay
    element.addEventListener('blur', () => {
      setTimeout(() => {
        if (!activePopover || !activePopover.contains(document.activeElement)) {
          hidePopover();
        }
      }, 200);
    });
  }

  /**
   * Create wrapper div for relative positioning
   */
  function createWrapper(element) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ai-grammar-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.style.width = '100%';

    // Insert wrapper before element
    element.parentNode.insertBefore(wrapper, element);
    wrapper.appendChild(element);

    return wrapper;
  }

  /**
   * Create overlay for highlighting errors
   */
  function createOverlay(element) {
    const overlay = document.createElement('div');
    overlay.id = `grammar-overlay-${Date.now()}`;
    overlay.className = 'ai-grammar-overlay';

    // Copy dimensions and positioning
    const style = window.getComputedStyle(element);
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = element.offsetWidth + 'px';
    overlay.style.height = element.offsetHeight + 'px';
    overlay.style.padding = style.padding;
    overlay.style.border = style.border;
    overlay.style.borderColor = 'transparent';
    overlay.style.font = style.font;
    overlay.style.lineHeight = style.lineHeight;
    overlay.style.whiteSpace = style.whiteSpace;
    overlay.style.wordWrap = style.wordWrap;
    overlay.style.pointerEvents = 'none';
    overlay.style.overflow = 'hidden';
    overlay.style.zIndex = '1';

    // Make element transparent background and higher z-index
    element.style.position = 'relative';
    element.style.zIndex = '2';
    element.style.background = 'transparent';

    return overlay;
  }

  /**
   * Handle input changes with debounce
   */
  function handleInput(element, overlay) {

    // Clear existing timer
    const existingTimer = debounceTimers.get(element);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      await checkGrammar(element, overlay);
      debounceTimers.delete(element);
    }, DEBOUNCE_DELAY);

    debounceTimers.set(element, timer);

    // Update overlay size
    updateOverlaySize(element, overlay);
  }

  /**
   * Update overlay dimensions
   */
  function updateOverlaySize(element, overlay) {
    overlay.style.width = element.offsetWidth + 'px';
    overlay.style.height = element.offsetHeight + 'px';
  }

  /**
   * Check grammar for element content
   */
  async function checkGrammar(element, overlay) {
    const text = element.value || element.textContent;

    if (!text || text.trim().length < 3) {
      overlay.innerHTML = '';
      currentCorrections.delete(element);
      return;
    }

    try {
      // Show subtle loading indicator
      overlay.innerHTML = '<div class="ai-grammar-checking">Checking...</div>';

      // Get corrections from ProofreaderService
      const result = await ProofreaderService.proofread(text, null, null);

      if (!result || !result.corrections || result.corrections.length === 0) {
        overlay.innerHTML = '';
        currentCorrections.delete(element);
        return;
      }


      // Store corrections
      currentCorrections.set(element, result.corrections);

      // Render highlights
      renderHighlights(element, overlay, text, result.corrections);

    } catch (error) {
      console.error('❌ [GrammarChecker] Grammar check error:', error);
      overlay.innerHTML = '';
      currentCorrections.delete(element);
    }
  }

  /**
   * Render error highlights in overlay
   */
  function renderHighlights(element, overlay, text, corrections) {
    let html = '';
    let lastIndex = 0;

    // Sort corrections by position
    const sortedCorrections = [...corrections].sort((a, b) => a.startIndex - b.startIndex);

    sortedCorrections.forEach((correction, idx) => {
      // Add text before error
      if (correction.startIndex > lastIndex) {
        html += escapeHtml(text.substring(lastIndex, correction.startIndex));
      }

      // Add highlighted error
      const errorText = text.substring(correction.startIndex, correction.endIndex);
      const color = ProofreaderService.getTypeColor(correction.type);

      html += `<span class="ai-grammar-error" data-correction-index="${idx}" style="text-decoration: underline wavy ${color}; text-decoration-thickness: 2px; cursor: pointer;">${escapeHtml(errorText)}</span>`;

      lastIndex = correction.endIndex;
    });

    // Add remaining text
    if (lastIndex < text.length) {
      html += escapeHtml(text.substring(lastIndex));
    }

    overlay.innerHTML = html;

    // Add click handlers to error spans
    overlay.querySelectorAll('.ai-grammar-error').forEach(span => {
      span.style.pointerEvents = 'auto';
      span.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(span.dataset.correctionIndex);
        const correction = sortedCorrections[index];
        showSuggestionPopover(element, correction, span);
      });
    });
  }

  /**
   * Handle click on element to check cursor position
   */
  function handleClick(element, event) {
    const corrections = currentCorrections.get(element);
    if (!corrections || corrections.length === 0) return;

    const cursorPos = element.selectionStart;

    // Find correction at cursor position
    const correction = corrections.find(c =>
      cursorPos >= c.startIndex && cursorPos <= c.endIndex
    );

    if (correction) {
      showSuggestionPopover(element, correction, event.target);
    } else {
      hidePopover();
    }
  }

  /**
   * Show suggestion popover for a correction
   */
  function showSuggestionPopover(element, correction, targetElement) {
    hidePopover();

    const popover = document.createElement('div');
    popover.className = 'ai-grammar-suggestion-popover';

    const typeName = ProofreaderService.getTypeName(correction.type);
    const color = ProofreaderService.getTypeColor(correction.type);

    const suggestions = correction.correction ? [correction.correction] : [];

    popover.innerHTML = `
      <div class="ai-grammar-popover-header">
        <span class="ai-grammar-type-badge" style="background: ${color};">${typeName}</span>
      </div>
      ${correction.explanation ? `<div class="ai-grammar-explanation">${correction.explanation}</div>` : ''}
      ${suggestions.length > 0 ? `
        <div class="ai-grammar-suggestions">
          ${suggestions.map(s => `
            <button class="ai-grammar-suggestion-btn" data-suggestion="${escapeHtml(s)}">
              ${escapeHtml(s)}
            </button>
          `).join('')}
        </div>
      ` : '<div class="ai-grammar-no-suggestion">Remove this word</div>'}
      <div class="ai-grammar-popover-actions">
        <button class="ai-grammar-dismiss-btn">Dismiss</button>
      </div>
    `;

    document.body.appendChild(popover);
    activePopover = popover;

    // Position popover
    const rect = targetElement.getBoundingClientRect();
    positionPopover(popover, rect);

    // Add event listeners
    popover.querySelectorAll('.ai-grammar-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const suggestion = btn.dataset.suggestion;
        applySuggestion(element, correction, suggestion);
        hidePopover();
      });
    });

    popover.querySelector('.ai-grammar-dismiss-btn').addEventListener('click', () => {
      hidePopover();
    });

    // Click outside to close
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick, { once: true });
    }, 10);
  }

  /**
   * Position popover near target
   */
  function positionPopover(popover, targetRect) {
    const popoverRect = popover.getBoundingClientRect();

    let top = targetRect.bottom + window.scrollY + 5;
    let left = targetRect.left + window.scrollX;

    // Adjust if goes off screen
    if (left + popoverRect.width > window.innerWidth) {
      left = window.innerWidth - popoverRect.width - 10;
    }

    if (top + popoverRect.height > window.innerHeight + window.scrollY) {
      top = targetRect.top + window.scrollY - popoverRect.height - 5;
    }

    popover.style.top = top + 'px';
    popover.style.left = left + 'px';
  }

  /**
   * Hide active popover
   */
  function hidePopover() {
    if (activePopover) {
      activePopover.remove();
      activePopover = null;
    }
  }

  /**
   * Handle click outside popover
   */
  function handleOutsideClick(e) {
    if (activePopover && !activePopover.contains(e.target)) {
      hidePopover();
    }
  }

  /**
   * Apply suggestion to element
   */
  function applySuggestion(element, correction, suggestion) {
    const text = element.value || element.textContent;
    const newText = text.substring(0, correction.startIndex) +
                    suggestion +
                    text.substring(correction.endIndex);

    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
      element.value = newText;
    } else {
      element.textContent = newText;
    }

    // Trigger input event
    element.dispatchEvent(new Event('input', { bubbles: true }));

    // Recheck grammar
    const overlay = document.getElementById(element.dataset.grammarOverlay);
    if (overlay) {
      setTimeout(() => checkGrammar(element, overlay), 100);
    }
  }

  /**
   * Escape HTML
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Remove grammar checking from element
   */
  function detachFromElement(element) {
    if (!element || element.dataset.grammarCheckerAttached !== 'true') {
      return;
    }

    const timer = debounceTimers.get(element);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.delete(element);
    }

    currentCorrections.delete(element);
    element.dataset.grammarCheckerAttached = 'false';

    hidePopover();
  }

  /**
   * Initialize on all editable fields (optional auto-attach)
   */
  function initializeAll() {

    // Find all textareas and contenteditable elements
    const editables = document.querySelectorAll('textarea, [contenteditable="true"]');

    editables.forEach(element => {

      // Only attach to large text fields (not single-line inputs)
      if (element.tagName === 'TEXTAREA' ||
          (element.getAttribute('contenteditable') === 'true' && element.offsetHeight > 100)) {
        attachToElement(element);
      } else {
      }
    });

  }

  // Public API
  return {
    attachToElement,
    detachFromElement,
    initializeAll,
    hidePopover
  };
})();

// Make globally available
window.GrammarChecker = GrammarChecker;

// Creado por David Montero Crespo para WriteBee

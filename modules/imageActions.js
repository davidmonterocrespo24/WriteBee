/**
 * Image Actions Module
 * Adds floating action buttons to medium and large images on the page
 */

const ImageActionsModule = (function() {
  const MIN_IMAGE_SIZE = 200; // Minimum width/height in pixels
  let observedImages = new WeakSet();
  let imageObserver = null;

  /**
   * Check if image is large enough
   */
  function isImageLargeEnough(img) {
    const rect = img.getBoundingClientRect();
    return rect.width >= MIN_IMAGE_SIZE && rect.height >= MIN_IMAGE_SIZE;
  }

  /**
   * Create action button overlay for an image
   */
  function createImageActionButton(img) {
    // Skip if already has button or is too small
    if (img.dataset.hasActionButton || !isImageLargeEnough(img)) {
      return;
    }

    // Mark as processed
    img.dataset.hasActionButton = 'true';
    observedImages.add(img);

    // Create container for the button
    const container = document.createElement('div');
    container.className = 'writebee-img-action-container';
    container.setAttribute('data-writebee', 'true');
    container.innerHTML = `
      <style>
        .writebee-img-action-container {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 10000;
        }

        .writebee-img-action-btn {
          background: rgba(255, 212, 0, 0.95);
          border: none;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .writebee-img-action-btn:hover {
          background: rgba(255, 212, 0, 1);
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .writebee-img-action-btn svg {
          width: 20px;
          height: 20px;
          color: #1a1a1a;
        }

        .writebee-img-action-menu {
          position: absolute;
          top: 45px;
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          padding: 8px;
          min-width: 200px;
          display: none;
          animation: writebee-slideDown 0.2s ease;
        }

        .writebee-img-action-menu.show {
          display: block;
        }

        @keyframes writebee-slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .writebee-img-action-menu-item {
          padding: 10px 12px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 10px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          color: #1a1a1a;
        }

        .writebee-img-action-menu-item:hover {
          background: #f5f5f5;
        }

        .writebee-img-action-menu-item svg {
          width: 18px;
          height: 18px;
          color: #666;
          flex-shrink: 0;
        }
      </style>

      <button class="writebee-img-action-btn" title="WriteBee AI Actions">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="12" cy="5" r="1"/>
          <circle cx="12" cy="19" r="1"/>
        </svg>
      </button>

      <div class="writebee-img-action-menu">
        <div class="writebee-img-action-menu-item" data-action="ocr">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Extract Text (OCR)
        </div>

        <div class="writebee-img-action-menu-item" data-action="explain">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Explain Image
        </div>

        <div class="writebee-img-action-menu-item" data-action="describe">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Describe Image
        </div>
      </div>
    `;

    // Position the container
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';
    wrapper.className = 'writebee-img-wrapper';
    wrapper.setAttribute('data-writebee', 'true');

    // Wrap the image
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);
    wrapper.appendChild(container);

    // Button and menu references
    const button = container.querySelector('.writebee-img-action-btn');
    const menu = container.querySelector('.writebee-img-action-menu');
    const menuItems = container.querySelectorAll('.writebee-img-action-menu-item');

    // Toggle menu
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      menu.classList.toggle('show');
    });

    // Handle menu item clicks
    menuItems.forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        e.preventDefault();

        const action = item.dataset.action;
        const imageUrl = img.src || img.currentSrc;

        console.log('IMAGE_ACTIONS: Action triggered:', action, 'for image:', imageUrl);

        // Close menu
        menu.classList.remove('show');

        // Trigger the action (will be handled by content.js handlers)
        try {
          if (action === 'ocr') {
            if (typeof handleOCRRequest === 'function') {
              handleOCRRequest(imageUrl);
            }
          } else if (action === 'explain') {
            if (typeof handleExplainImage === 'function') {
              handleExplainImage(imageUrl);
            }
          } else if (action === 'describe') {
            if (typeof handleDescribeImage === 'function') {
              handleDescribeImage(imageUrl);
            }
          }
        } catch (error) {
          console.error('IMAGE_ACTIONS: Error triggering action:', error);
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', () => {
      menu.classList.remove('show');
    });
  }

  /**
   * Process all images on the page
   */
  function processImages() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
      // Skip if already processed
      if (observedImages.has(img)) {
        return;
      }

      // Wait for image to load
      if (img.complete) {
        createImageActionButton(img);
      } else {
        img.addEventListener('load', () => {
          createImageActionButton(img);
        }, { once: true });
      }
    });
  }

  /**
   * Initialize the module
   */
  function init() {
    console.log('IMAGE_ACTIONS: Initializing...');

    // Process existing images
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', processImages);
    } else {
      processImages();
    }

    // Watch for new images
    imageObserver = new MutationObserver((mutations) => {
      let shouldProcess = false;

      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'IMG') {
              shouldProcess = true;
            } else if (node.querySelectorAll) {
              const images = node.querySelectorAll('img');
              if (images.length > 0) {
                shouldProcess = true;
              }
            }
          }
        });
      });

      if (shouldProcess) {
        setTimeout(processImages, 100);
      }
    });

    imageObserver.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('IMAGE_ACTIONS: Initialized successfully');
  }

  /**
   * Cleanup
   */
  function destroy() {
    if (imageObserver) {
      imageObserver.disconnect();
    }

    // Remove all action buttons
    document.querySelectorAll('.writebee-img-wrapper').forEach(wrapper => {
      const img = wrapper.querySelector('img');
      if (img) {
        wrapper.parentNode.insertBefore(img, wrapper);
        wrapper.remove();
      }
    });
  }

  return {
    init,
    destroy
  };
})();

// Auto-initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    ImageActionsModule.init();
  });
} else {
  ImageActionsModule.init();
}

// Creado por David Montero Crespo para WriteBee

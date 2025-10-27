/**
 * Proofreader Service Module - Handles grammar and spelling checking using Chrome's Proofreader API
 * @author David Montero Crespo
 * @project WriteBee
 * @description Provides grammar checking, spell checking, and text correction using on-device AI
 */
const ProofreaderService = (function() {
  let proofreaderInstance = null;
  let isDownloading = false;

  /**
   * Check if Proofreader API is available
   * @returns {Promise<string>} - 'readily', 'downloadable', or 'no'
   */
  async function checkAvailability() {
    try {
      if (!self.Proofreader || typeof self.Proofreader.availability !== 'function') {
        console.warn('Proofreader API not available in this browser');
        return 'no';
      }

      const availability = await self.Proofreader.availability();
      return availability;
    } catch (error) {
      console.error('Error checking Proofreader availability:', error);
      return 'no';
    }
  }

  /**
   * Create or get existing Proofreader instance
   * @param {Function} onDownloadProgress - Callback for download progress (0-1)
   * @returns {Promise<Object>} Proofreader instance
   */
  async function getProofreader(onDownloadProgress = null) {
    // Return existing instance if available
    if (proofreaderInstance) {
      return proofreaderInstance;
    }

    const availability = await checkAvailability();

    if (availability === 'no') {
      throw new Error('Proofreader API is not available. Make sure you are using Chrome 141+ and have enabled the origin trial.');
    }

    try {
      isDownloading = availability === 'downloadable';


      proofreaderInstance = await self.Proofreader.create({
        expectedInputLanguages: ['en'],
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            const progress = e.loaded || 0;

            if (onDownloadProgress) {
              onDownloadProgress(progress);
            }

            if (progress >= 1) {
              isDownloading = false;
            }
          });
        }
      });

      return proofreaderInstance;
    } catch (error) {
      console.error('Error creating Proofreader:', error);
      proofreaderInstance = null;
      throw new Error(`Failed to create Proofreader: ${error.message}`);
    }
  }

  /**
   * Group corrections by type
   * @param {Array} corrections - Array of correction objects
   * @returns {Object} Corrections grouped by type
   */
  function groupCorrectionsByType(corrections) {
    const grouped = {
      spelling: [],
      punctuation: [],
      capitalization: [],
      preposition: [],
      'missing-words': [],
      grammar: [],
      other: []
    };

    corrections.forEach(correction => {
      const type = correction.type || 'other';
      if (grouped[type]) {
        grouped[type].push(correction);
      } else {
        grouped.other.push(correction);
      }
    });

    return grouped;
  }

  /**
   * Get statistics about corrections
   * @param {Array} corrections - Array of correction objects
   * @returns {Object} Statistics object
   */
  function getCorrectionsStats(corrections) {
    const grouped = groupCorrectionsByType(corrections);

    return {
      total: corrections.length,
      byType: {
        spelling: grouped.spelling.length,
        punctuation: grouped.punctuation.length,
        capitalization: grouped.capitalization.length,
        preposition: grouped.preposition.length,
        'missing-words': grouped['missing-words'].length,
        grammar: grouped.grammar.length,
        other: grouped.other.length
      }
    };
  }

  /**
   * Check grammar and spelling in text
   * @param {string} text - Text to proofread
   * @param {Function} onProgress - Progress callback
   * @param {AbortSignal} signal - Abort signal
   * @param {string} language - Language code (e.g., 'en')
   * @returns {Promise<Object>} Result with original, corrected text and corrections
   */
  async function proofread(text, onProgress = null, signal = null, language = 'en') {
    try {
      if (!text || text.trim().length === 0) {
        throw new Error('No text provided for proofreading');
      }


      // Check for abort
      if (signal && signal.aborted) {
        throw new Error('Proofreading cancelled');
      }

      // Update progress - Initializing
      if (onProgress) {
        onProgress({
          stage: 'initializing',
          message: 'Initializing proofreader...',
          progress: 0
        });
      }

      // Get or create Proofreader instance
      const proofreader = await getProofreader((downloadProgress) => {
        if (onProgress) {
          onProgress({
            stage: 'downloading',
            message: `Downloading grammar model: ${Math.round(downloadProgress * 100)}%`,
            progress: downloadProgress * 0.5 // First 50% is download
          });
        }
      });

      // Check for abort
      if (signal && signal.aborted) {
        throw new Error('Proofreading cancelled');
      }

      // Update progress - Processing
      if (onProgress) {
        onProgress({
          stage: 'processing',
          message: 'Analyzing text...',
          progress: 0.6
        });
      }

      // Perform proofreading
      const result = await proofreader.proofread(text);


      // Update progress - Complete
      if (onProgress) {
        onProgress({
          stage: 'complete',
          message: 'Analysis complete',
          progress: 1
        });
      }

      // Structure the result
      const corrections = result.corrections || [];
      const correctedText = result.correctedInput || text;

      return {
        original: text,
        corrected: correctedText,
        corrections: corrections,
        stats: getCorrectionsStats(corrections),
        grouped: groupCorrectionsByType(corrections),
        hasErrors: corrections.length > 0
      };

    } catch (error) {
      console.error('Error in proofread:', error);

      // Check if it's an abort error
      if (error.message.includes('cancel') || error.message.includes('abort')) {
        throw new Error('Grammar check cancelled by user');
      }

      throw new Error(`Grammar check failed: ${error.message}`);
    }
  }

  /**
   * Apply a specific correction to text
   * @param {string} text - Original text
   * @param {Object} correction - Correction object with startIndex, endIndex, correction
   * @returns {string} Text with correction applied
   */
  function applyCorrection(text, correction) {
    const before = text.substring(0, correction.startIndex);
    const after = text.substring(correction.endIndex);
    const correctedWord = correction.correction || '';

    return before + correctedWord + after;
  }

  /**
   * Apply all corrections to text
   * @param {string} text - Original text
   * @param {Array} corrections - Array of correction objects
   * @returns {string} Fully corrected text
   */
  function applyAllCorrections(text, corrections) {
    // Sort corrections by startIndex in descending order
    // This way we apply from end to start, avoiding index shifts
    const sortedCorrections = [...corrections].sort((a, b) => b.startIndex - a.startIndex);

    let correctedText = text;
    sortedCorrections.forEach(correction => {
      correctedText = applyCorrection(correctedText, correction);
    });

    return correctedText;
  }

  /**
   * Destroy the Proofreader instance
   */
  function destroy() {
    if (proofreaderInstance) {
      proofreaderInstance = null;
    }
  }

  /**
   * Get human-readable type name
   * @param {string} type - Correction type
   * @returns {string} Human-readable name
   */
  function getTypeName(type) {
    const typeNames = {
      'spelling': 'Spelling',
      'punctuation': 'Punctuation',
      'capitalization': 'Capitalization',
      'preposition': 'Preposition',
      'missing-words': 'Missing Words',
      'grammar': 'Grammar',
      'other': 'Other'
    };
    return typeNames[type] || 'Other';
  }

  /**
   * Get color for error type (for UI highlighting)
   * @param {string} type - Correction type
   * @returns {string} Color hex code
   */
  function getTypeColor(type) {
    const typeColors = {
      'spelling': '#ef4444',      // red
      'grammar': '#f59e0b',        // amber
      'punctuation': '#3b82f6',    // blue
      'capitalization': '#10b981', // green
      'preposition': '#8b5cf6',    // purple
      'missing-words': '#ec4899',  // pink
      'other': '#6b7280'           // gray
    };
    return typeColors[type] || typeColors.other;
  }

  // Public API
  return {
    checkAvailability,
    proofread,
    applyCorrection,
    applyAllCorrections,
    getCorrectionsStats,
    groupCorrectionsByType,
    getTypeName,
    getTypeColor,
    destroy,
    isDownloading: () => isDownloading
  };
})();

// Make it globally available
window.ProofreaderService = ProofreaderService;

// Creado por David Montero Crespo para WriteBee

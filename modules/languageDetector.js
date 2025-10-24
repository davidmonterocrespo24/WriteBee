/**
 * Language Detector Service - Detects language of text using Chrome's Language Detector API
 * @author David Montero Crespo
 * @project WriteBee
 * @description Provides language detection for grammar checking and translation
 */
const LanguageDetectorService = (function() {
  let detectorInstance = null;

  /**
   * Check if Language Detector API is available
   */
  function checkAvailability() {
    try {
      if (!self.LanguageDetector || typeof self.LanguageDetector.availability !== 'function') {
        console.warn('Language Detector API not available in this browser');
        return 'no';
      }
      return 'available';
    } catch (error) {
      console.error('Error checking Language Detector availability:', error);
      return 'no';
    }
  }

  /**
   * Create or get existing Language Detector instance
   */
  async function getDetector(onDownloadProgress = null) {
    if (detectorInstance) {
      return detectorInstance;
    }

    const availability = checkAvailability();
    if (availability === 'no') {
      throw new Error('Language Detector API is not available');
    }

    try {
      console.log('Creating Language Detector instance...');

      detectorInstance = await self.LanguageDetector.create({
        monitor(m) {
          m.addEventListener('downloadprogress', (e) => {
            const progress = e.loaded || 0;
            console.log(`Language Detector model download: ${Math.round(progress * 100)}%`);
            if (onDownloadProgress) {
              onDownloadProgress(progress);
            }
          });
        }
      });

      console.log('Language Detector instance created successfully');
      return detectorInstance;
    } catch (error) {
      console.error('Error creating Language Detector:', error);
      detectorInstance = null;
      throw new Error(`Failed to create Language Detector: ${error.message}`);
    }
  }

  /**
   * Detect language of text
   * @param {string} text - Text to analyze
   * @param {Object} options - Detection options
   * @returns {Promise<Object>} Detection result with language and confidence
   */
  async function detectLanguage(text, options = {}) {
    try {
      if (!text || text.trim().length < 3) {
        return {
          detectedLanguage: 'unknown',
          confidence: 0,
          allResults: []
        };
      }

      const detector = await getDetector(options.onDownloadProgress);
      const results = await detector.detect(text);

      // Convert to array if not already
      const resultsArray = Array.isArray(results) ? results : [results];

      if (resultsArray.length === 0) {
        return {
          detectedLanguage: 'unknown',
          confidence: 0,
          allResults: []
        };
      }

      // Get top result
      const topResult = resultsArray[0];

      return {
        detectedLanguage: topResult.detectedLanguage || topResult.language || 'unknown',
        confidence: topResult.confidence || 0,
        allResults: resultsArray.map(r => ({
          language: r.detectedLanguage || r.language,
          confidence: r.confidence
        }))
      };

    } catch (error) {
      console.error('Error detecting language:', error);
      return {
        detectedLanguage: 'unknown',
        confidence: 0,
        allResults: [],
        error: error.message
      };
    }
  }

  /**
   * Get language name from code
   */
  function getLanguageName(code) {
    const languageNames = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'nl': 'Dutch',
      'ru': 'Russian',
      'ja': 'Japanese',
      'zh': 'Chinese',
      'ko': 'Korean',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'pl': 'Polish',
      'tr': 'Turkish',
      'sv': 'Swedish',
      'da': 'Danish',
      'fi': 'Finnish',
      'no': 'Norwegian',
      'cs': 'Czech',
      'el': 'Greek',
      'he': 'Hebrew',
      'th': 'Thai',
      'vi': 'Vietnamese',
      'id': 'Indonesian',
      'ms': 'Malay',
      'unknown': 'Unknown'
    };
    return languageNames[code] || code.toUpperCase();
  }

  /**
   * Get supported languages for grammar checking
   * Currently Proofreader API primarily supports English
   */
  function getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', supported: true },
      { code: 'es', name: 'Spanish', supported: false },
      { code: 'fr', name: 'French', supported: false },
      { code: 'de', name: 'German', supported: false },
      { code: 'it', name: 'Italian', supported: false },
      { code: 'pt', name: 'Portuguese', supported: false }
    ];
  }

  /**
   * Check if language is supported for grammar checking
   */
  function isLanguageSupported(languageCode) {
    // Currently only English is fully supported by Proofreader API
    return languageCode === 'en';
  }

  /**
   * Detect and validate language for grammar checking
   */
  async function detectAndValidate(text) {
    const detection = await detectLanguage(text);

    return {
      detectedLanguage: detection.detectedLanguage,
      confidence: detection.confidence,
      isSupported: isLanguageSupported(detection.detectedLanguage),
      languageName: getLanguageName(detection.detectedLanguage),
      allResults: detection.allResults
    };
  }

  /**
   * Destroy the Language Detector instance
   */
  function destroy() {
    if (detectorInstance) {
      detectorInstance = null;
      console.log('Language Detector instance destroyed');
    }
  }

  // Public API
  return {
    checkAvailability,
    detectLanguage,
    detectAndValidate,
    getLanguageName,
    getSupportedLanguages,
    isLanguageSupported,
    destroy
  };
})();

// Make globally available
window.LanguageDetectorService = LanguageDetectorService;

// Creado por David Montero Crespo para WriteBee

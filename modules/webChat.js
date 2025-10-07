const WebChatModule = (function() {
  let pageContent = null;
  let pageSummary = null;

  /**
   * Extract text content from current page
   */
  function extractPageContent() {
    // Get main content, excluding scripts, styles, nav, footer, etc.
    const content = [];

    // Try to get article content first
    const article = document.querySelector('article, main, [role="main"]');
    if (article) {
      content.push(article.innerText);
    } else {
      // Get all paragraphs and headings
      const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li');
      elements.forEach(el => {
        const text = el.innerText.trim();
        if (text.length > 20) { // Filter out very short text
          content.push(text);
        }
      });
    }

    return content.join('\n\n');
  }

  /**
   * Get page metadata
   */
  function getPageMetadata() {
    return {
      title: document.title,
      url: window.location.href,
      description: document.querySelector('meta[name="description"]')?.content || '',
      domain: window.location.hostname
    };
  }

  /**
   * Summarize current page
   */
  async function summarizePage(onProgress = null) {
    try {
      if (!pageContent) {
        pageContent = extractPageContent();
      }

      if (onProgress) onProgress('Analyzing page content...');

      const metadata = getPageMetadata();
      const prompt = `Summarize this web page:\n\nTitle: ${metadata.title}\nURL: ${metadata.url}\n\nContent:\n${pageContent.substring(0, 8000)}`;

      pageSummary = await AIModule.aiSummarize(prompt);

      return pageSummary;
    } catch (error) {
      throw new Error('Page summarization error: ' + error.message);
    }
  }

  /**
   * Chat with current page
   */
  async function chatWithPage(question, onProgress = null) {
    try {
      if (!pageContent) {
        pageContent = extractPageContent();
      }

      if (onProgress) onProgress('Processing your question...');

      const metadata = getPageMetadata();
      const context = `Based on this web page:\n\nTitle: ${metadata.title}\nURL: ${metadata.url}\n\nContent:\n${pageContent.substring(0, 8000)}\n\nQuestion: ${question}`;

      const answer = await AIModule.aiPrompt(context);

      return answer;
    } catch (error) {
      throw new Error('Page chat error: ' + error.message);
    }
  }

  /**
   * Chat with multiple tabs
   */
  async function chatWithTabs(question, tabContents, onProgress = null) {
    try {
      if (onProgress) onProgress('Processing multiple tabs...');

      const context = `Based on these web pages:\n\n${tabContents.map((tab, i) =>
        `Page ${i + 1}: ${tab.title}\nURL: ${tab.url}\nContent: ${tab.content.substring(0, 2000)}...\n`
      ).join('\n')}\n\nQuestion: ${question}`;

      const answer = await AIModule.aiPrompt(context);

      return answer;
    } catch (error) {
      throw new Error('Multi-tab chat error: ' + error.message);
    }
  }

  /**
   * Extract key points from page
   */
  async function extractKeyPoints(onProgress = null) {
    try {
      if (!pageContent) {
        pageContent = extractPageContent();
      }

      if (onProgress) onProgress('Extracting key points...');

      const metadata = getPageMetadata();
      const prompt = `Extract the key points from this web page as bullet points:\n\nTitle: ${metadata.title}\n\nContent:\n${pageContent.substring(0, 8000)}`;

      const result = await AIModule.aiPrompt(prompt);

      return result;
    } catch (error) {
      throw new Error('Key points extraction error: ' + error.message);
    }
  }

  /**
   * Explain page content
   */
  async function explainPage(onProgress = null) {
    try {
      if (!pageContent) {
        pageContent = extractPageContent();
      }

      if (onProgress) onProgress('Explaining page content...');

      const metadata = getPageMetadata();
      const prompt = `Explain this web page in simple terms:\n\nTitle: ${metadata.title}\n\nContent:\n${pageContent.substring(0, 8000)}`;

      const result = await AIModule.aiExplain(prompt);

      return result;
    } catch (error) {
      throw new Error('Page explanation error: ' + error.message);
    }
  }

  /**
   * Translate page
   */
  async function translatePage(targetLanguage = 'en', onProgress = null) {
    try {
      if (!pageContent) {
        pageContent = extractPageContent();
      }

      if (onProgress) onProgress('Translating page...');

      const result = await AIModule.aiTranslate(pageContent.substring(0, 8000), targetLanguage);

      return result;
    } catch (error) {
      throw new Error('Page translation error: ' + error.message);
    }
  }

  /**
   * Initialize web chat module
   */
  function init() {
    // Web chat is now integrated into the main chat panel (Ctrl+M)
    // The "Chat with this page" option is available in the chat suggestions
    // No need for a separate floating button
  }

  return {
    extractPageContent,
    getPageMetadata,
    summarizePage,
    chatWithPage,
    chatWithTabs,
    extractKeyPoints,
    explainPage,
    translatePage,
    init
  };
})();

// Initialize
if (typeof window !== 'undefined') {
  window.WebChatModule = WebChatModule;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      WebChatModule.init();
    });
  } else {
    WebChatModule.init();
  }
}

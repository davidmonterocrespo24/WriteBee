const WebChatModule = (function() {
  let pageContent = null;
  let pageSummary = null;
  let ragEngine = null;
  let isIndexed = false;
  let cachedMetadata = null;

  /**
   * Extract text content from current page
   */
  function extractPageContent() {
    // Get ALL content including navigation, excluding only WriteBee elements
    const content = [];

    // Helper function to check if element should be excluded
    const shouldExcludeElement = (element) => {
      if (!element) return true;

      // Exclude script, style, and other non-visible elements
      const tagName = element.tagName ? element.tagName.toLowerCase() : '';
      if (['script', 'style', 'noscript', 'iframe', 'embed', 'object', 'svg'].includes(tagName)) {
        return true;
      }

      // Check if element or any parent has WriteBee classes/attributes
      let current = element;
      while (current && current !== document.body) {
        const classList = current.classList || [];
        const className = current.className || '';
        const id = current.id || '';

        // Check for WriteBee-specific classes, IDs, or attributes
        if (
          // Image action buttons
          classList.contains('writebee-img-action-container') ||
          classList.contains('writebee-img-action-menu') ||
          classList.contains('writebee-img-wrapper') ||
          // Microphone permission overlay
          id === 'writebee-mic-permission-overlay' ||
          className.includes('writebee-mic') ||
          // AI dialogs and panels
          classList.contains('ai-result-panel') ||
          classList.contains('ai-twitter-dialog') ||
          classList.contains('ai-linkedin-dialog') ||
          // Float buttons
          classList.contains('ai-float-btn-container') ||
          classList.contains('ai-float-btn') ||
          // Toolbars and menus
          classList.contains('ai-toolbar') ||
          classList.contains('ai-menu') ||
          // Other WriteBee elements
          className.includes('writebee-') ||
          className.includes('ai-') ||
          current.hasAttribute('data-writebee') ||
          current.hasAttribute('data-ai-extension')
        ) {
          return true;
        }

        current = current.parentElement;
      }

      return false;
    };

    // IMPROVED: Extract content from multiple sections
    const sections = [];

    // 1. Navigation menus (IMPORTANT for finding "games" link)
    const navs = document.querySelectorAll('nav, [role="navigation"], header, .menu, .nav, [class*="menu"], [class*="nav"]');
    navs.forEach(nav => {
      if (shouldExcludeElement(nav)) return;

      // Clone and clean
      const clone = nav.cloneNode(true);
      // Remove all unwanted elements including WriteBee extension elements
      clone.querySelectorAll('script, style, noscript, iframe, embed, object, svg').forEach(el => el.remove());
      clone.querySelectorAll('[data-writebee]').forEach(el => el.remove());
      clone.querySelectorAll('[data-ai-extension]').forEach(el => el.remove());
      clone.querySelectorAll('[class*="writebee-"], [id*="writebee-"]').forEach(el => el.remove());
      clone.querySelectorAll('[class*="ai-"], [id*="ai-"]').forEach(el => el.remove());

      const text = clone.innerText.trim();
      if (text.length > 10) {
        sections.push(`[Navigation Menu]\n${text}`);
      }
    });

    // 2. Main content
    const article = document.querySelector('article, main, [role="main"]');
    if (article) {
      const clone = article.cloneNode(true);
      // Remove all unwanted elements including WriteBee extension elements
      clone.querySelectorAll('script, style, noscript, iframe, embed, object, svg').forEach(el => el.remove());
      clone.querySelectorAll('[data-writebee]').forEach(el => el.remove());
      clone.querySelectorAll('[data-ai-extension]').forEach(el => el.remove());
      clone.querySelectorAll('[class*="writebee-"], [id*="writebee-"]').forEach(el => el.remove());
      clone.querySelectorAll('[class*="ai-"], [id*="ai-"]').forEach(el => el.remove());

      const text = clone.innerText.trim();
      if (text) {
        sections.push(`[Main Content]\n${text}`);
      }
    }

    // 3. Important elements (headings, paragraphs, lists, links)
    const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, a[href]');
    const seenText = new Set();
    elements.forEach(el => {
      if (shouldExcludeElement(el)) return;

      const text = el.innerText.trim();
      // Avoid duplicates but include shorter navigation items
      if (text.length > 5 && !seenText.has(text)) {
        seenText.add(text);

        // Include link href if it's an anchor
        if (el.tagName === 'A' && el.href) {
          const url = new URL(el.href, window.location.href);
          if (url.hostname === window.location.hostname) {
            content.push(`${text} [Link: ${el.href}]`);
          } else {
            content.push(text);
          }
        } else {
          content.push(text);
        }
      }
    });

    // Combine all sections
    let allContent = [...sections, ...content].join('\n\n');

    // Clean up excessive whitespace to reduce tokens
    allContent = allContent
      // Remove WriteBee extension text patterns (specific combinations)
      .replace(/Extract Text \(OCR\)\s*Explain Image\s*Describe Image/g, '')
      .replace(/Extract Text \(OCR\)/g, '')
      .replace(/Explain Image/g, '')
      .replace(/Describe Image/g, '')
      // Replace multiple spaces with single space
      .replace(/[ \t]+/g, ' ')
      // Replace multiple newlines with maximum 2 newlines
      .replace(/\n{3,}/g, '\n\n')
      // Remove spaces at start/end of lines
      .replace(/^[ \t]+|[ \t]+$/gm, '')
      // Remove empty lines that only contain whitespace
      .replace(/^\s*\n/gm, '\n')
      // Final trim
      .trim();

    console.log('📄 EXTRACTION DETAILS:');
    console.log('  - Navigation sections:', navs.length);
    console.log('  - Total sections:', sections.length);
    console.log('  - Individual elements:', content.length);
    console.log('  - Final content length:', allContent.length, 'characters');

    return allContent;
  }

  /**
   * Get page metadata
   */
  function getPageMetadata() {
    // If metadata was cached (from side panel), use it
    if (cachedMetadata) {
      console.log('📋 Using cached metadata:', cachedMetadata);
      return cachedMetadata;
    }

    // Otherwise, extract from current document
    return {
      title: document.title,
      url: window.location.href,
      description: document.querySelector('meta[name="description"]')?.content || '',
      domain: window.location.hostname
    };
  }

  /**
   * Extract all links from current page
   */
  function extractPageLinks() {
    const links = [];
    const currentDomain = window.location.hostname;
    
    document.querySelectorAll('a[href]').forEach(anchor => {
      try {
        const url = new URL(anchor.href, window.location.href);
        
        // Only include same-domain links (internal links)
        if (url.hostname === currentDomain && 
            !url.href.includes('#') && 
            !url.href.endsWith('.pdf') &&
            !url.href.endsWith('.jpg') &&
            !url.href.endsWith('.png')) {
          links.push(url.href);
        }
      } catch (e) {
        // Ignore invalid URLs
      }
    });
    
    // Remove duplicates
    return [...new Set(links)];
  }

  /**
   * Initialize RAG Engine with current page
   */
  async function initializeRAG(onProgress = null) {
    try {

      if (!window.RAGEngine) {
        console.error('❌ RAG Engine is NOT loaded in window');
        throw new Error('RAG Engine not loaded');
      }

      if (onProgress) onProgress('Initializing RAG Engine...');

      // Get or create RAG instance
      ragEngine = RAGEngine.getInstance();

      // Clear previous index
      ragEngine.clear();

      // If pageContent was already set manually (e.g., from side panel), use it
      // Otherwise, extract fresh content from current document
      if (!pageContent || pageContent.length === 0) {
        console.log('📄 Extracting fresh page content from current document...');
        pageContent = extractPageContent();
      } else {
        console.log('📄 Using pre-set page content (from side panel or other source)');
      }

      console.log('📄 Page content length:', pageContent.length, 'characters');
      console.log('📄 First 200 chars:', pageContent.substring(0, 200));

      if (onProgress) onProgress('Indexing current page...');

      // Index current page
      const metadata = getPageMetadata();

      await ragEngine.indexPage(pageContent, metadata);

      isIndexed = true;

      // Log indexing statistics
      const indexSize = ragEngine.index ? ragEngine.index.length : 0;
      console.log('✅ RAG Engine initialized and indexed');
      console.log(`📊 Index statistics: ${indexSize} chunks created`);

      return true;
    } catch (error) {
      console.error('❌ Error initializing RAG:', error);
      throw error;
    }
  }

  /**
   * Index relevant links based on question
   */
  async function indexRelevantLinks(question, onProgress = null) {
    try {
      if (!ragEngine) {
        await initializeRAG(onProgress);
      }

      const links = extractPageLinks();

      if (links.length === 0) {

        return;
      }

      // Determine how many links to index based on total count
      const maxLinks = links.length <= 10 ? Math.min(3, links.length) : 5;
      
      if (onProgress) onProgress(`Analyzing ${links.length} links for relevance...`);
      
      // Index relevant links
      await ragEngine.indexLinks(links, question, maxLinks);

    } catch (error) {
      console.error('❌ Error indexing links:', error);
      // Don't throw - continue with current page only
    }
  }

  /**
   * Summarize current page using RAG
   */
  async function summarizePage(onProgress = null) {
    try {
      // Check if we have a PDF loaded
      if (window.PDFModule && typeof PDFModule.hasPDFLoaded === 'function' && PDFModule.hasPDFLoaded()) {

        return await PDFModule.summarizePDF(onProgress);
      }

      // Initialize RAG
      if (!isIndexed) {
        await initializeRAG(onProgress);
      }

      if (onProgress) onProgress('Analyzing page structure...');

      // Get more chunks for a comprehensive summary (increased from 8 to 15)
      const summaryQuery = 'main topics key points important information summary overview content sections details';
      const relevantChunks = ragEngine.retrieve(summaryQuery, 15);

      const context = ragEngine.buildContext(relevantChunks);
      const metadata = getPageMetadata();

      if (onProgress) onProgress('Generating comprehensive summary...');

      // Improved prompt for more detailed summaries
      const prompt = `Create a complete and detailed summary of this web page. Include:
- The main points and key topics
- Important information and relevant details
- The structure and organization of the content
- Conclusions or main ideas

Title: ${metadata.title}
URL: ${metadata.url}

Content:
${context}

Please provide an extensive and well-structured summary that captures all the important information from the page.`;

      pageSummary = await AIModule.aiSummarize(prompt);

      return pageSummary;
    } catch (error) {
      console.error('❌ Error in summarizePage:', error);
      
      // Fallback with more content
      if (!pageContent) {
        pageContent = extractPageContent();
      }

      const metadata = getPageMetadata();
      const prompt = `Create a complete and detailed summary of this web page:

Title: ${metadata.title}
URL: ${metadata.url}

Content:
${pageContent.substring(0, 12000)}

Include all the main points, important information and content structure.`;

      pageSummary = await AIModule.aiSummarize(prompt);
      return pageSummary;
    }
  }

  /**
   * Chat with current page using RAG
   */
  async function chatWithPage(question, onProgress = null) {
    try {



      // Check if we have a PDF loaded
      if (window.PDFModule && typeof PDFModule.hasPDFLoaded === 'function' && PDFModule.hasPDFLoaded()) {

        return await PDFModule.chatWithPDF(question, onProgress);
      }

      // Initialize RAG if not already done
      if (!isIndexed) {

        await initializeRAG(onProgress);
      }

      // Index relevant links based on question
      if (onProgress) onProgress('Finding relevant content...');

      await indexRelevantLinks(question, onProgress);

      // Retrieve relevant chunks (increased from 5 to 8 for better coverage)
      if (onProgress) onProgress('Retrieving relevant information...');

      const relevantChunks = ragEngine.retrieve(question, 8);

      console.log(`🔍 Retrieved ${relevantChunks.length} relevant chunks for question: "${question}"`);

      // Build context from retrieved chunks
      const context = ragEngine.buildContext(relevantChunks);

      // Extract all internal links from page
      const pageLinks = extractPageLinks();
      const linksContext = pageLinks.length > 0
        ? `\n\nAvailable pages on this site:\n${pageLinks.slice(0, 10).map((link, i) => `${i+1}. ${link}`).join('\n')}`
        : '';

      if (onProgress) onProgress('Generating answer...');

      // Build prompt with context
      const metadata = getPageMetadata();
      const prompt = `You are answering a question about the website: ${metadata.title}
Current URL: ${metadata.url}

${context}${linksContext}

User question: ${question}

Instructions:
- Provide a comprehensive and accurate answer based on the information above
- If you find relevant links in the "Available pages" section, mention them with their full URLs
- If the answer mentions navigation items or menu options, specify where they are located
- If you see a link that matches what the user is asking for, include it in your answer
- If the information is not sufficient, say so clearly

Answer:`;






      const answer = await AIModule.aiPrompt(prompt);



      return answer;
    } catch (error) {
      console.error('❌ WEB CHAT: Error in chatWithPage:', error);
      
      // Fallback to simple chat without RAG
      if (onProgress) onProgress('Using fallback method...');
      
      if (!pageContent) {
        pageContent = extractPageContent();
      }

      const metadata = getPageMetadata();
      const context = `Based on this web page:\n\nTitle: ${metadata.title}\nURL: ${metadata.url}\n\nContent:\n${pageContent.substring(0, 8000)}\n\nQuestion: ${question}`;


      const answer = await AIModule.aiPrompt(context);
      return answer;
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
   * Extract key points from page using RAG
   */
  async function extractKeyPoints(onProgress = null) {
    try {
      // Check if we have a PDF loaded
      if (window.PDFModule && typeof PDFModule.hasPDFLoaded === 'function' && PDFModule.hasPDFLoaded()) {
        return await PDFModule.extractKeyPointsFromPDF(onProgress);
      }

      // Initialize RAG
      if (!isIndexed) {
        await initializeRAG(onProgress);
      }

      if (onProgress) onProgress('Extracting key points...');

      // Retrieve diverse chunks
      const query = 'important key main essential critical significant';
      const relevantChunks = ragEngine.retrieve(query, 10);

      const context = ragEngine.buildContext(relevantChunks);
      const metadata = getPageMetadata();

      const prompt = `Extract the key points from this web page as bullet points:\n\nTitle: ${metadata.title}\n\n${context}`;

      const result = await AIModule.aiPrompt(prompt);

      return result;
    } catch (error) {
      console.error('❌ Error in extractKeyPoints:', error);
      
      // Fallback
      if (!pageContent) {
        pageContent = extractPageContent();
      }

      const metadata = getPageMetadata();
      const prompt = `Extract the key points from this web page as bullet points:\n\nTitle: ${metadata.title}\n\nContent:\n${pageContent.substring(0, 8000)}`;

      const result = await AIModule.aiPrompt(prompt);
      return result;
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
   * Upload and process PDF for chat
   */
  async function uploadPDF(pdfFile, onProgress = null) {
    try {
      if (!window.PDFModule) {
        throw new Error('PDF Module not loaded');
      }

      if (onProgress) onProgress('Processing PDF...');
      
      // Process PDF for chat (this will clear previous content)
      const result = await PDFModule.processPDFForChat(pdfFile, onProgress);
      
      // Reset page indexing since we now have PDF content
      isIndexed = false;
      pageContent = null;
      pageSummary = null;
      
      return result;
    } catch (error) {
      console.error('❌ Error uploading PDF:', error);
      throw error;
    }
  }

  /**
   * Get current PDF info
   */
  function getCurrentPDFInfo() {
    if (window.PDFModule) {
      return PDFModule.getCurrentPDFInfo();
    }
    return null;
  }

  /**
   * Clear current PDF
   */
  function clearCurrentPDF() {
    if (window.PDFModule) {
      PDFModule.clearCurrentPDF();
      // Reset page indexing
      isIndexed = false;
      pageContent = null;
      pageSummary = null;
    }
  }

  /**
   * Check if PDF is currently loaded
   */
  function hasPDFLoaded() {
    return window.PDFModule && typeof PDFModule.hasPDFLoaded === 'function' ? PDFModule.hasPDFLoaded() : false;
  }

  /**
   * Clear page content and reset RAG
   */
  function clearPageContent() {
    console.log('🧹 Clearing page content and RAG cache...');
    isIndexed = false;
    pageContent = null;
    pageSummary = null;
    cachedMetadata = null;
    // Clear RAG engine instance if exists
    if (ragEngine) {
      ragEngine.clear();
    }
  }

  /**
   * Force re-index of current page (useful after page changes)
   */
  async function forceReindex(onProgress = null) {
    console.log('🔄 Forcing page re-index...');
    clearPageContent();
    return await initializeRAG(onProgress);
  }

  /**
   * Set page content manually (para cuando viene del side panel)
   */
  function setPageContent(content, metadata = null) {
    console.log('📝 Setting page content manually');
    console.log('  - Content length:', content ? content.length : 0, 'characters');
    console.log('  - Metadata:', metadata);

    pageContent = content;
    if (metadata) {
      cachedMetadata = metadata;
      console.log('  - Cached metadata:', cachedMetadata);
    }
    // Reset indexing flag to force re-indexing
    isIndexed = false;
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
    extractPageLinks,
    initializeRAG,
    indexRelevantLinks,
    summarizePage,
    chatWithPage,
    chatWithTabs,
    extractKeyPoints,
    explainPage,
    translatePage,
    uploadPDF,
    getCurrentPDFInfo,
    clearCurrentPDF,
    clearPageContent,
    setPageContent,
    hasPDFLoaded,
    forceReindex,
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



// Creado por David Montero Crespo para WriteBee

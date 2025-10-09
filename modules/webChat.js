const WebChatModule = (function() {
  let pageContent = null;
  let pageSummary = null;
  let ragEngine = null;
  let isIndexed = false;

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
        throw new Error('RAG Engine not loaded');
      }

      if (onProgress) onProgress('Initializing RAG Engine...');
      
      // Get or create RAG instance
      ragEngine = RAGEngine.getInstance();
      
      // Clear previous index
      ragEngine.clear();
      
      // Extract content
      if (!pageContent) {
        pageContent = extractPageContent();
      }
      
      if (onProgress) onProgress('Indexing current page...');
      
      // Index current page
      const metadata = getPageMetadata();
      await ragEngine.indexPage(pageContent, metadata);
      
      isIndexed = true;
      
      console.log('✅ RAG Engine initialized and page indexed');
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
      console.log(`🔗 Found ${links.length} internal links`);

      if (links.length === 0) {
        console.log('ℹ️ No links to index');
        return;
      }

      // Determine how many links to index based on total count
      const maxLinks = links.length <= 10 ? Math.min(3, links.length) : 5;
      
      if (onProgress) onProgress(`Analyzing ${links.length} links for relevance...`);
      
      // Index relevant links
      await ragEngine.indexLinks(links, question, maxLinks);
      
      console.log('✅ Relevant links indexed');
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
        console.log('📄 PDF detectado, usando PDFModule.summarizePDF');
        return await PDFModule.summarizePDF(onProgress);
      }

      console.log('🌐 Resumiendo página web con RAG');

      // Initialize RAG
      if (!isIndexed) {
        await initializeRAG(onProgress);
      }

      if (onProgress) onProgress('Analyzing page structure...');

      // Get key chunks using a summarization query
      const summaryQuery = 'main topics key points important information summary overview';
      const relevantChunks = ragEngine.retrieve(summaryQuery, 8);

      const context = ragEngine.buildContext(relevantChunks);
      const metadata = getPageMetadata();

      if (onProgress) onProgress('Generating summary...');

      const prompt = `Summarize this web page in a clear and concise way:\n\nTitle: ${metadata.title}\nURL: ${metadata.url}\n\n${context}`;

      pageSummary = await AIModule.aiSummarize(prompt);

      return pageSummary;
    } catch (error) {
      console.error('❌ Error in summarizePage:', error);
      
      // Fallback
      if (!pageContent) {
        pageContent = extractPageContent();
      }

      const metadata = getPageMetadata();
      const prompt = `Summarize this web page:\n\nTitle: ${metadata.title}\nURL: ${metadata.url}\n\nContent:\n${pageContent.substring(0, 8000)}`;

      pageSummary = await AIModule.aiSummarize(prompt);
      return pageSummary;
    }
  }

  /**
   * Chat with current page using RAG
   */
  async function chatWithPage(question, onProgress = null) {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('💬 WEB CHAT: Starting chat');
      console.log('❓ Question:', question);
      
      // Check if we have a PDF loaded
      if (window.PDFModule && typeof PDFModule.hasPDFLoaded === 'function' && PDFModule.hasPDFLoaded()) {
        console.log('📄 WEB CHAT: Detected PDF loaded, delegating to PDFModule');
        return await PDFModule.chatWithPDF(question, onProgress);
      }

      console.log('🌐 WEB CHAT: Using web page content');
      
      // Initialize RAG if not already done
      if (!isIndexed) {
        console.log('🔧 WEB CHAT: RAG not indexed, initializing...');
        await initializeRAG(onProgress);
      }

      // Index relevant links based on question
      if (onProgress) onProgress('Finding relevant content...');
      console.log('🔗 WEB CHAT: Indexing relevant links...');
      await indexRelevantLinks(question, onProgress);

      // Retrieve relevant chunks
      if (onProgress) onProgress('Retrieving relevant information...');
      console.log('🔍 WEB CHAT: Retrieving relevant chunks...');
      const relevantChunks = ragEngine.retrieve(question, 5);

      // Build context from retrieved chunks
      console.log('📝 WEB CHAT: Building context...');
      const context = ragEngine.buildContext(relevantChunks);

      if (onProgress) onProgress('Generating answer...');

      // Build prompt with context
      const metadata = getPageMetadata();
      const prompt = `You are answering a question about the website: ${metadata.title}

${context}

User question: ${question}

Please provide a comprehensive and accurate answer based on the information above. If the information is not sufficient, say so.`;

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📤 WEB CHAT: SENDING PROMPT TO AI');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(prompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Prompt length:', prompt.length, 'characters');

      const answer = await AIModule.aiPrompt(prompt);

      console.log('✅ WEB CHAT: Received answer from AI');
      console.log('📊 Answer length:', answer.length, 'characters');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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

      console.log('⚠️ WEB CHAT: Using fallback prompt');
      console.log('📤 Fallback prompt length:', context.length, 'characters');

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
    hasPDFLoaded,
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

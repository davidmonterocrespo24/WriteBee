/**
 * RAG Engine Module
 * Lightweight Retrieval-Augmented Generation for web content
 */
const RAGEngine = (function() {
  
  // Simple but effective TF-IDF vectorization
  class SimpleVectorizer {
    constructor() {
      this.vocabulary = new Map();
      this.idf = new Map();
      this.stopWords = new Set([
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
        'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
        'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by'
      ]);
    }

    tokenize(text) {
      return text
        .toLowerCase()
        .replace(/[^\w\sáéíóúñü]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !this.stopWords.has(word));
    }

    computeTF(tokens) {
      const tf = new Map();
      const total = tokens.length;
      
      tokens.forEach(token => {
        tf.set(token, (tf.get(token) || 0) + 1);
      });
      
      // Normalize
      tf.forEach((count, token) => {
        tf.set(token, count / total);
      });
      
      return tf;
    }

    computeIDF(documents) {
      const docCount = documents.length;
      const docFreq = new Map();
      
      documents.forEach(tokens => {
        const uniqueTokens = new Set(tokens);
        uniqueTokens.forEach(token => {
          docFreq.set(token, (docFreq.get(token) || 0) + 1);
        });
      });
      
      docFreq.forEach((freq, token) => {
        this.idf.set(token, Math.log(docCount / freq));
      });
    }

    vectorize(tokens, tf) {
      const vector = new Map();
      
      tokens.forEach(token => {
        const tfValue = tf.get(token) || 0;
        const idfValue = this.idf.get(token) || 0;
        vector.set(token, tfValue * idfValue);
      });
      
      return vector;
    }

    cosineSimilarity(vec1, vec2) {
      let dotProduct = 0;
      let mag1 = 0;
      let mag2 = 0;
      
      const allKeys = new Set([...vec1.keys(), ...vec2.keys()]);
      
      allKeys.forEach(key => {
        const v1 = vec1.get(key) || 0;
        const v2 = vec2.get(key) || 0;
        dotProduct += v1 * v2;
        mag1 += v1 * v1;
        mag2 += v2 * v2;
      });
      
      if (mag1 === 0 || mag2 === 0) return 0;
      return dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
    }
  }

  // Chunk creator
  class ChunkCreator {
    constructor(chunkSize = 500, overlap = 100) {
      this.chunkSize = chunkSize;
      this.overlap = overlap;
    }

    createChunks(text, metadata = {}) {
      const sentences = this.splitIntoSentences(text);
      const chunks = [];
      let currentChunk = [];
      let currentLength = 0;

      sentences.forEach((sentence, idx) => {
        const sentenceLength = sentence.split(/\s+/).length;
        
        if (currentLength + sentenceLength > this.chunkSize && currentChunk.length > 0) {
          // Save current chunk
          chunks.push({
            text: currentChunk.join(' '),
            metadata: { ...metadata, chunkIndex: chunks.length },
            wordCount: currentLength
          });
          
          // Start new chunk with overlap
          const overlapSentences = this.getOverlapSentences(currentChunk, this.overlap);
          currentChunk = [...overlapSentences];
          currentLength = currentChunk.join(' ').split(/\s+/).length;
        }
        
        currentChunk.push(sentence);
        currentLength += sentenceLength;
      });

      // Add last chunk
      if (currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.join(' '),
          metadata: { ...metadata, chunkIndex: chunks.length },
          wordCount: currentLength
        });
      }

      return chunks;
    }

    splitIntoSentences(text) {
      // Split by common sentence endings
      return text
        .split(/[.!?]+\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }

    getOverlapSentences(sentences, overlapWords) {
      const joined = sentences.join(' ');
      const words = joined.split(/\s+/);
      const overlapText = words.slice(-overlapWords).join(' ');
      return this.splitIntoSentences(overlapText);
    }
  }

  // URL relevance scorer
  class URLScorer {
    constructor() {
      this.commonPatterns = {
        contact: /contact|contacto|contactanos|contactenos|about|acerca/i,
        products: /product|producto|shop|tienda|catalogo|catalog/i,
        services: /service|servicio|what-we-do|que-hacemos/i,
        pricing: /price|precio|pricing|precios|plan|planes/i,
        about: /about|acerca|nosotros|who-we-are|quienes-somos/i,
        help: /help|ayuda|faq|preguntas|support|soporte/i,
        blog: /blog|news|noticias|article|articulo/i,
        careers: /career|trabajo|jobs|empleo|join/i
      };
    }

    scoreURL(url, question) {
      const questionTokens = question.toLowerCase().split(/\s+/);
      let score = 0;
      const urlLower = url.toLowerCase();

      // Check for direct keyword matches
      questionTokens.forEach(token => {
        if (urlLower.includes(token)) {
          score += 5;
        }
      });

      // Check for semantic matches
      Object.entries(this.commonPatterns).forEach(([category, pattern]) => {
        if (pattern.test(question) && pattern.test(urlLower)) {
          score += 10;
        }
      });

      // Prefer shorter URLs (more specific)
      const depth = url.split('/').length;
      score -= depth * 0.5;

      // Boost URLs with common extensions
      if (/\.(html|htm|php)$/.test(urlLower)) {
        score += 2;
      }

      return Math.max(0, score);
    }

    rankURLs(urls, question, limit = 5) {
      return urls
        .map(url => ({
          url,
          score: this.scoreURL(url, question)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.url);
    }
  }

  // Main RAG Engine
  class RAG {
    constructor() {
      this.vectorizer = new SimpleVectorizer();
      this.chunkCreator = new ChunkCreator(500, 100);
      this.urlScorer = new URLScorer();
      this.index = [];
      this.isIndexed = false;
    }

    async indexPage(pageContent, pageMetadata) {
      console.log('🔍 Indexing page:', pageMetadata.title);
      
      // Create chunks
      const chunks = this.chunkCreator.createChunks(pageContent, {
        source: 'current_page',
        title: pageMetadata.title,
        url: pageMetadata.url
      });

      // Tokenize all chunks
      const allTokens = chunks.map(chunk => 
        this.vectorizer.tokenize(chunk.text)
      );

      // Compute IDF
      this.vectorizer.computeIDF(allTokens);

      // Vectorize chunks
      chunks.forEach((chunk, idx) => {
        const tokens = allTokens[idx];
        const tf = this.vectorizer.computeTF(tokens);
        const vector = this.vectorizer.vectorize(tokens, tf);
        
        this.index.push({
          ...chunk,
          tokens,
          vector
        });
      });

      this.isIndexed = true;
      console.log(`✅ Indexed ${chunks.length} chunks from current page`);
    }

    async indexLinks(links, question, maxLinks = 5) {
      console.log(`🔗 Analyzing ${links.length} links...`);
      
      // Score and rank URLs
      const relevantURLs = this.urlScorer.rankURLs(links, question, maxLinks);
      console.log('📊 Top relevant URLs:', relevantURLs);

      // Fetch and index relevant pages
      const fetchPromises = relevantURLs.map(async url => {
        try {
          const response = await fetch(url);
          const html = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          // Extract text content
          const content = this.extractTextFromDoc(doc);
          
          // Create chunks
          const chunks = this.chunkCreator.createChunks(content, {
            source: 'linked_page',
            url: url,
            title: doc.title || url
          });

          return chunks;
        } catch (error) {
          console.warn(`⚠️ Failed to fetch ${url}:`, error.message);
          return [];
        }
      });

      const allChunks = (await Promise.all(fetchPromises)).flat();
      
      // Tokenize
      const allTokens = allChunks.map(chunk => 
        this.vectorizer.tokenize(chunk.text)
      );

      // Update IDF with new documents
      this.vectorizer.computeIDF([
        ...this.index.map(item => item.tokens),
        ...allTokens
      ]);

      // Vectorize and add to index
      allChunks.forEach((chunk, idx) => {
        const tokens = allTokens[idx];
        const tf = this.vectorizer.computeTF(tokens);
        const vector = this.vectorizer.vectorize(tokens, tf);
        
        this.index.push({
          ...chunk,
          tokens,
          vector
        });
      });

      console.log(`✅ Indexed ${allChunks.length} chunks from ${relevantURLs.length} linked pages`);
    }

    extractTextFromDoc(doc) {
      // Remove scripts, styles, nav, footer
      const unwanted = doc.querySelectorAll('script, style, nav, footer, header, aside');
      unwanted.forEach(el => el.remove());

      // Get main content
      const main = doc.querySelector('article, main, [role="main"]');
      if (main) {
        return main.innerText;
      }

      // Fallback to body
      return doc.body.innerText || '';
    }

    retrieve(query, topK = 5) {
      if (!this.isIndexed || this.index.length === 0) {
        return [];
      }

      console.log(`🔍 Retrieving top ${topK} chunks for query:`, query.substring(0, 50));

      // Vectorize query
      const queryTokens = this.vectorizer.tokenize(query);
      const queryTF = this.vectorizer.computeTF(queryTokens);
      const queryVector = this.vectorizer.vectorize(queryTokens, queryTF);

      // Compute similarities
      const results = this.index.map(item => ({
        ...item,
        similarity: this.vectorizer.cosineSimilarity(queryVector, item.vector)
      }));

      // Sort by similarity and prioritize current page
      results.sort((a, b) => {
        // Boost current page chunks
        const aBoost = a.metadata.source === 'current_page' ? 0.2 : 0;
        const bBoost = b.metadata.source === 'current_page' ? 0.2 : 0;
        return (b.similarity + bBoost) - (a.similarity + aBoost);
      });

      const topResults = results.slice(0, topK);
      console.log('📊 Top results:', topResults.map(r => ({
        similarity: r.similarity.toFixed(3),
        source: r.metadata.source,
        preview: r.text.substring(0, 50) + '...'
      })));

      return topResults;
    }

    buildContext(retrievedChunks) {
      if (retrievedChunks.length === 0) {
        return '';
      }

      let context = 'Relevant information:\n\n';
      
      retrievedChunks.forEach((chunk, idx) => {
        const source = chunk.metadata.source === 'current_page' 
          ? 'Current page' 
          : `Linked page: ${chunk.metadata.url}`;
        
        context += `[${idx + 1}] ${source}\n`;
        context += `${chunk.text}\n\n`;
      });

      return context;
    }

    clear() {
      this.index = [];
      this.isIndexed = false;
      this.vectorizer = new SimpleVectorizer();
    }
  }

  // Singleton instance
  let ragInstance = null;

  function getInstance() {
    if (!ragInstance) {
      ragInstance = new RAG();
    }
    return ragInstance;
  }

  return {
    getInstance,
    RAG,
    SimpleVectorizer,
    ChunkCreator,
    URLScorer
  };
})();

// Export
if (typeof window !== 'undefined') {
  window.RAGEngine = RAGEngine;
}

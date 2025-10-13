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
        // Spanish stop words
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
        'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
        'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
        'la', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy',
        'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo',
        'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
        'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
        'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
        'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte',
        'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar',
        'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo', 'solo',
        'decir', 'estos', 'trabajar', 'salir', 'puede', 'casa', 'mil', 'durante',
        
        // English stop words
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for',
        'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by',
        'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
        'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
        'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
        'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your', 'good',
        'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now', 'look', 'only',
        'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how',
        'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
        'these', 'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
        'were', 'said', 'did', 'having', 'may', 'should', 'am', 'being', 'does', 'done',
        
        // French stop words
        'le', 'de', 'un', 'être', 'et', 'à', 'il', 'avoir', 'ne', 'je', 'son', 'que',
        'se', 'qui', 'ce', 'dans', 'en', 'du', 'elle', 'au', 'pour', 'pas', 'que',
        'vous', 'par', 'sur', 'faire', 'plus', 'dire', 'me', 'on', 'mon', 'lui',
        'nous', 'comme', 'mais', 'pouvoir', 'avec', 'tout', 'y', 'aller', 'voir',
        'savoir', 'leur', 'si', 'prendre', 'venir', 'même', 'encore', 'aussi',
        
        // German stop words
        'der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des',
        'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch',
        'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach', 'wird',
        'bei', 'einer', 'um', 'am', 'sind', 'noch', 'wie', 'einem', 'über', 'einen',
        'so', 'zum', 'war', 'haben', 'nur', 'oder', 'aber', 'vor', 'zur', 'bis',
        
        // Italian stop words
        'di', 'che', 'è', 'per', 'un', 'il', 'in', 'non', 'una', 'sono', 'mi',
        'ho', 'lo', 'ma', 'ha', 'cosa', 'le', 'sei', 'ti', 'gli', 'nel', 'al',
        'questo', 'qui', 'quello', 'della', 'dei', 'del', 'tu', 'te', 'delle',
        'alla', 'gli', 'nelle', 'tutti', 'anche', 'fare', 'più', 'essere', 'stato',
        
        // Portuguese stop words
        'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'ao', 'aos', 'à', 'às',
        'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'pelo', 'pela', 'pelos',
        'pelas', 'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
        'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso', 'aquilo', 'eu',
        'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas', 'me', 'te', 'se', 'lhe',
        'nos', 'vos', 'lhes', 'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus',
        'tuas', 'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas'
      ]);
    }

    tokenize(text) {
      return text
        .toLowerCase()
        // Support for multiple languages: Spanish, French, German, Italian, Portuguese
        .replace(/[^\w\sáéíóúñüàâäèêëïîôöùûçãõ]/g, ' ')
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
    constructor(chunkSize = 300, overlap = 50) { // Reduced from 500/100 to 300/50
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
        // Contact patterns (EN, ES, FR, DE, IT, PT)
        contact: /contact|contacto|contactanos|contactenos|contáctanos|contáctenos|about|acerca|contact-us|nous-contacter|kontakt|kontaktieren|contattaci|contato|fale-conosco/i,
        
        // Products patterns
        products: /product|producto|productos|shop|tienda|catalogo|catalog|catalogue|store|magasin|boutique|geschäft|laden|negozio|prodotti|loja|produtos/i,
        
        // Services patterns
        services: /service|servicio|servicios|what-we-do|que-hacemos|nos-services|dienstleistungen|servizi|serviços/i,
        
        // Pricing patterns
        pricing: /price|precio|precios|pricing|plan|planes|plans|tarif|tarifs|preis|preise|prezzo|prezzi|preço|preços|cost|coste|costo|custo/i,
        
        // About patterns
        about: /about|acerca|nosotros|who-we-are|quienes-somos|quiénes-somos|about-us|qui-sommes-nous|über-uns|chi-siamo|sobre-nos|nossa-empresa|company|empresa|société|unternehmen|azienda|team|equipo|équipe/i,
        
        // Help & Support patterns
        help: /help|ayuda|faq|preguntas|support|soporte|aide|hilfe|aiuto|ajuda|frequently-asked|preguntas-frecuentes|centro-ayuda|help-center|kundenservice|assistenza/i,
        
        // Blog & News patterns
        blog: /blog|news|noticias|article|articulo|artículo|articles|actualités|neuigkeiten|notizie|notícias|post|entrada|beitrag/i,
        
        // Careers patterns
        careers: /career|trabajo|jobs|empleo|join|únete|trabaja-con-nosotros|work-with-us|carrières|emploi|karriere|stelle|lavora-con-noi|carreiras|trabalhe-conosco|hiring|recruiting|reclutamiento/i,
        
        // Features patterns
        features: /feature|características|funcionalidades|fonctionnalités|funktionen|caratteristiche|recursos|what-we-offer|que-ofrecemos/i,
        
        // Documentation patterns
        documentation: /doc|documentation|documentación|documentação|guide|guía|tutorial|manual|help-docs|api-docs/i,
        
        // Download patterns
        download: /download|descargar|télécharger|herunterladen|scaricare|baixar|get|obtener/i,
        
        // Login/Account patterns
        account: /login|signin|sign-in|register|signup|sign-up|account|cuenta|connexion|inscription|anmelden|registrieren|accedi|registrati|entrar|cadastro/i,
        
        // Terms & Privacy patterns
        legal: /terms|términos|conditions|condiciones|privacy|privacidad|politique|datenschutz|confidentialité|politica|privacidade|legal|cookie|gdpr/i,
        
        // Portfolio/Gallery patterns
        portfolio: /portfolio|portafolio|gallery|galería|galerie|galleria|trabalhos|projetos|projects|proyectos|projets|projekte|progetti/i,
        
        // Testimonials/Reviews patterns
        reviews: /testimonial|testimonio|review|reseña|opinión|avis|bewertung|recensione|avaliação|cliente|customer|client/i,
        
        // Partners patterns
        partners: /partner|socio|partenaire|partnerschaften|collaborazioni|parceiro|alliance|colaboración/i,
        
        // Events patterns
        events: /event|evento|événement|veranstaltung|eventi|webinar|conference|conferencia|conférence|konferenz|conferenza/i
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
      this.chunkCreator = new ChunkCreator(300, 50); // Reduced chunk size
      this.urlScorer = new URLScorer();
      this.index = [];
      this.isIndexed = false;
      this.currentSource = null; // Track current content source
    }

    async indexPage(pageContent, pageMetadata) {



      // Set current source
      this.currentSource = pageMetadata.source || 'current_page';
      
      // Create chunks

      const chunks = this.chunkCreator.createChunks(pageContent, {
        source: this.currentSource,
        title: pageMetadata.title,
        url: pageMetadata.url,
        ...pageMetadata
      });

      // Log first chunk as example
      if (chunks.length > 0) {

      }

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


    }

    async indexLinks(links, question, maxLinks = 5) {

      // Score and rank URLs
      const relevantURLs = this.urlScorer.rankURLs(links, question, maxLinks);

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
        console.warn('⚠️ RAG: No content indexed yet');
        return [];
      }

      // Vectorize query for semantic similarity
      const queryTokens = this.vectorizer.tokenize(query);
      const queryTF = this.vectorizer.computeTF(queryTokens);
      const queryVector = this.vectorizer.vectorize(queryTokens, queryTF);

      // Extract keywords from query (non-stopwords)
      const queryKeywords = new Set(queryTokens);
      const queryLower = query.toLowerCase();

      // Compute hybrid score: semantic similarity + keyword matching
      const results = this.index.map(item => {
        // 1. Semantic similarity (TF-IDF cosine similarity)
        const semanticScore = this.vectorizer.cosineSimilarity(queryVector, item.vector);

        // 2. Keyword matching score
        let keywordScore = 0;
        const textLower = item.text.toLowerCase();

        // Direct keyword matches (exact matches in text)
        queryKeywords.forEach(keyword => {
          if (textLower.includes(keyword)) {
            keywordScore += 0.3; // Boost for each keyword match
          }
        });

        // Phrase matching (original query appears in text)
        if (textLower.includes(queryLower)) {
          keywordScore += 1.0; // Strong boost for exact phrase match
        }

        // 3. Combine scores (weighted: 60% semantic, 40% keywords)
        const hybridScore = (semanticScore * 0.6) + (keywordScore * 0.4);

        return {
          ...item,
          semanticScore,
          keywordScore,
          similarity: hybridScore
        };
      });

      // Sort by hybrid similarity and prioritize current page
      results.sort((a, b) => {
        // Boost current page chunks
        const aBoost = a.metadata.source === 'current_page' ? 0.15 : 0;
        const bBoost = b.metadata.source === 'current_page' ? 0.15 : 0;
        return (b.similarity + bBoost) - (a.similarity + aBoost);
      });

      // Filter out chunks with very low scores
      const filteredResults = results.filter(r => r.similarity > 0.05);

      const topResults = filteredResults.slice(0, topK);

      console.log(`🔍 Hybrid retrieval for "${query}":`);
      topResults.forEach((r, idx) => {
        console.log(`  [${idx+1}] Score: ${r.similarity.toFixed(3)} (semantic: ${r.semanticScore.toFixed(3)}, keyword: ${r.keywordScore.toFixed(3)}) - "${r.text.substring(0, 60)}..."`);
      });

      return topResults;
    }

    buildContext(retrievedChunks) {
      if (retrievedChunks.length === 0) {
        console.warn('⚠️ RAG: No chunks to build context from');
        return '';
      }



      let context = 'Relevant information:\n\n';
      let totalChars = 0;
      
      retrievedChunks.forEach((chunk, idx) => {
        const source = chunk.metadata.source === 'current_page' 
          ? 'Current page' 
          : chunk.metadata.source === 'pdf'
          ? `PDF: ${chunk.metadata.title}`
          : `Linked page: ${chunk.metadata.url}`;
        
        const chunkText = `[${idx + 1}] ${source}\n${chunk.text}\n\n`;
        context += chunkText;
        totalChars += chunk.text.length;





      });


      return context;
    }

    clear() {
      this.index = [];
      this.isIndexed = false;
      this.currentSource = null;
      this.vectorizer = new SimpleVectorizer();
    }

    /**
     * Get current content source info
     */
    getCurrentSource() {
      return this.currentSource;
    }

    /**
     * Check if content is from PDF
     */
    isPDFContent() {
      return this.currentSource === 'pdf';
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



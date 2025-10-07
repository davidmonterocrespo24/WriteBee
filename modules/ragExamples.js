/**
 * RAG Engine - Usage Examples
 * 
 * Este archivo muestra cómo usar el RAG Engine directamente
 * en tu código si deseas integrarlo en otras partes de la extensión
 */

// ============================================
// Ejemplo 1: Uso básico - Chat con página actual
// ============================================

async function example1_BasicPageChat() {
  console.log('📚 Ejemplo 1: Chat básico con página');
  
  // 1. Obtener instancia del RAG
  const rag = RAGEngine.getInstance();
  
  // 2. Extraer contenido de la página
  const pageContent = WebChatModule.extractPageContent();
  const metadata = WebChatModule.getPageMetadata();
  
  console.log('📄 Página:', metadata.title);
  console.log('📏 Caracteres:', pageContent.length);
  
  // 3. Indexar la página
  await rag.indexPage(pageContent, metadata);
  console.log('✅ Página indexada');
  
  // 4. Hacer una pregunta
  const question = '¿Cuáles son los puntos principales de esta página?';
  const chunks = rag.retrieve(question, 5);
  
  console.log(`🔍 Encontrados ${chunks.length} chunks relevantes`);
  chunks.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1}:`);
    console.log('Similitud:', chunk.similarity.toFixed(3));
    console.log('Preview:', chunk.text.substring(0, 100) + '...');
  });
  
  // 5. Construir contexto
  const context = rag.buildContext(chunks);
  
  // 6. Enviar a la IA
  const prompt = `${context}\n\nPregunta del usuario: ${question}`;
  const answer = await AIModule.aiPrompt(prompt);
  
  console.log('💬 Respuesta:', answer);
  
  return answer;
}

// ============================================
// Ejemplo 2: Chat con enlaces relacionados
// ============================================

async function example2_ChatWithLinks() {
  console.log('📚 Ejemplo 2: Chat con enlaces');
  
  const rag = RAGEngine.getInstance();
  
  // 1. Indexar página actual
  const pageContent = WebChatModule.extractPageContent();
  const metadata = WebChatModule.getPageMetadata();
  await rag.indexPage(pageContent, metadata);
  
  // 2. Obtener enlaces de la página
  const links = WebChatModule.extractPageLinks();
  console.log(`🔗 Encontrados ${links.length} enlaces internos`);
  
  // 3. Pregunta que requiere navegar
  const question = '¿Cuáles son los precios de sus servicios?';
  
  // 4. Indexar enlaces relevantes
  await rag.indexLinks(links, question, 5);
  console.log('✅ Enlaces relevantes indexados');
  
  // 5. Buscar en todo el contenido indexado
  const chunks = rag.retrieve(question, 8);
  
  // Ver de dónde vienen los chunks
  console.log('📊 Distribución de chunks:');
  const distribution = {};
  chunks.forEach(chunk => {
    const source = chunk.metadata.source;
    distribution[source] = (distribution[source] || 0) + 1;
  });
  console.log(distribution);
  
  // 6. Generar respuesta
  const context = rag.buildContext(chunks);
  const prompt = `${context}\n\nPregunta: ${question}`;
  const answer = await AIModule.aiPrompt(prompt);
  
  console.log('💬 Respuesta:', answer);
  
  return answer;
}

// ============================================
// Ejemplo 3: Análisis de URL Scoring
// ============================================

function example3_URLScoring() {
  console.log('📚 Ejemplo 3: URL Scoring');
  
  const scorer = new RAGEngine.URLScorer();
  
  // URLs de ejemplo
  const urls = [
    'https://example.com/',
    'https://example.com/about',
    'https://example.com/contact',
    'https://example.com/pricing',
    'https://example.com/blog/article-1',
    'https://example.com/services',
    'https://example.com/products/category/item'
  ];
  
  // Diferentes preguntas
  const questions = [
    '¿Cómo puedo contactar a la empresa?',
    '¿Cuánto cuestan los servicios?',
    '¿Qué hace la empresa?',
    '¿Tienen artículos sobre marketing?'
  ];
  
  questions.forEach(question => {
    console.log(`\n❓ Pregunta: "${question}"`);
    const rankedURLs = scorer.rankURLs(urls, question, 3);
    console.log('🏆 Top 3 URLs más relevantes:');
    rankedURLs.forEach((url, i) => {
      console.log(`${i + 1}. ${url}`);
    });
  });
}

// ============================================
// Ejemplo 4: Vectorización y Similitud
// ============================================

function example4_Vectorization() {
  console.log('📚 Ejemplo 4: Vectorización');
  
  const vectorizer = new RAGEngine.SimpleVectorizer();
  
  // Documentos de ejemplo
  const docs = [
    'Los gatos son animales domésticos muy populares',
    'Los perros son los mejores amigos del hombre',
    'Las aves pueden volar por el cielo',
    'Los peces viven en el agua'
  ];
  
  // Tokenizar
  const allTokens = docs.map(doc => vectorizer.tokenize(doc));
  console.log('🔤 Tokens por documento:');
  allTokens.forEach((tokens, i) => {
    console.log(`Doc ${i + 1}:`, tokens);
  });
  
  // Calcular IDF
  vectorizer.computeIDF(allTokens);
  console.log('\n📊 IDF scores (algunos ejemplos):');
  const idfEntries = Array.from(vectorizer.idf.entries()).slice(0, 5);
  idfEntries.forEach(([term, idf]) => {
    console.log(`"${term}": ${idf.toFixed(3)}`);
  });
  
  // Vectorizar documentos
  const vectors = allTokens.map((tokens, i) => {
    const tf = vectorizer.computeTF(tokens);
    return vectorizer.vectorize(tokens, tf);
  });
  
  // Query
  const query = 'animales que vuelan';
  const queryTokens = vectorizer.tokenize(query);
  const queryTF = vectorizer.computeTF(queryTokens);
  const queryVector = vectorizer.vectorize(queryTokens, queryTF);
  
  console.log(`\n🔍 Query: "${query}"`);
  console.log('🎯 Similitudes:');
  vectors.forEach((vec, i) => {
    const similarity = vectorizer.cosineSimilarity(queryVector, vec);
    console.log(`Doc ${i + 1}: ${similarity.toFixed(3)} - "${docs[i]}"`);
  });
}

// ============================================
// Ejemplo 5: Chunking con Overlap
// ============================================

function example5_Chunking() {
  console.log('📚 Ejemplo 5: Chunking');
  
  const chunker = new RAGEngine.ChunkCreator(50, 10); // Chunks pequeños para demo
  
  const longText = `
    La inteligencia artificial es una rama de la ciencia de la computación.
    Se enfoca en crear sistemas que puedan realizar tareas que normalmente requieren inteligencia humana.
    Estas tareas incluyen el reconocimiento de voz, la toma de decisiones y la traducción de idiomas.
    El aprendizaje automático es un subcampo de la IA.
    Utiliza algoritmos para permitir que las computadoras aprendan de los datos.
    Las redes neuronales son un tipo de algoritmo de aprendizaje automático.
    Están inspiradas en la estructura del cerebro humano.
    El deep learning es una técnica que utiliza redes neuronales profundas.
    Ha revolucionado campos como el reconocimiento de imágenes y el procesamiento del lenguaje natural.
    Los modelos de lenguaje grandes como GPT han demostrado capacidades impresionantes.
  `.trim().replace(/\s+/g, ' ');
  
  const chunks = chunker.createChunks(longText, {
    source: 'ejemplo',
    title: 'Introducción a la IA'
  });
  
  console.log(`📦 Se crearon ${chunks.length} chunks`);
  chunks.forEach((chunk, i) => {
    console.log(`\n--- Chunk ${i + 1} ---`);
    console.log('Palabras:', chunk.wordCount);
    console.log('Texto:', chunk.text);
    console.log('Metadata:', chunk.metadata);
  });
  
  // Mostrar overlap
  if (chunks.length > 1) {
    console.log('\n🔄 Overlap entre chunks:');
    for (let i = 0; i < chunks.length - 1; i++) {
      const chunk1Words = chunks[i].text.split(/\s+/);
      const chunk2Words = chunks[i + 1].text.split(/\s+/);
      
      const lastWords = chunk1Words.slice(-10).join(' ');
      const firstWords = chunk2Words.slice(0, 10).join(' ');
      
      console.log(`Chunk ${i + 1} → ${i + 2}:`);
      console.log('Final:', lastWords);
      console.log('Inicio:', firstWords);
    }
  }
}

// ============================================
// Ejemplo 6: Uso completo en WebChatModule
// ============================================

async function example6_WebChatIntegration() {
  console.log('📚 Ejemplo 6: Integración completa');
  
  // Este es el flujo que se usa en WebChatModule.chatWithPage()
  
  const question = '¿De qué trata esta página?';
  
  // Progress callback
  const onProgress = (msg) => console.log('⏳', msg);
  
  try {
    // 1. Inicializar RAG
    onProgress('Inicializando RAG...');
    await WebChatModule.initializeRAG(onProgress);
    
    // 2. Indexar enlaces relevantes
    onProgress('Buscando contenido relevante...');
    await WebChatModule.indexRelevantLinks(question, onProgress);
    
    // 3. Usar chatWithPage que internamente usa el RAG
    onProgress('Generando respuesta...');
    const answer = await WebChatModule.chatWithPage(question, onProgress);
    
    console.log('✅ Respuesta:', answer);
    
    return answer;
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// ============================================
// Exportar ejemplos
// ============================================

window.RAGExamples = {
  example1_BasicPageChat,
  example2_ChatWithLinks,
  example3_URLScoring,
  example4_Vectorization,
  example5_Chunking,
  example6_WebChatIntegration
};

console.log('📖 RAG Examples cargados. Usa:');
console.log('  - RAGExamples.example1_BasicPageChat()');
console.log('  - RAGExamples.example2_ChatWithLinks()');
console.log('  - RAGExamples.example3_URLScoring()');
console.log('  - RAGExamples.example4_Vectorization()');
console.log('  - RAGExamples.example5_Chunking()');
console.log('  - RAGExamples.example6_WebChatIntegration()');

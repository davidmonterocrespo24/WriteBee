/**
 * RAG Engine Tests
 * Simple test suite to verify RAG functionality
 */

const RAGTests = {
  
  /**
   * Test 1: Vectorizer tokenization
   */
  test_tokenization() {
    console.log('🧪 Test 1: Tokenization');
    
    const vectorizer = new RAGEngine.SimpleVectorizer();
    
    const tests = [
      {
        input: 'Hello World! This is a test.',
        expected: ['hello', 'world', 'test']
      },
      {
        input: 'Los gatos son animales.',
        expected: ['los', 'gatos', 'son', 'animales']
      },
      {
        input: 'Testing 123 with números',
        expected: ['testing', 'with', 'números']
      }
    ];
    
    let passed = 0;
    tests.forEach((test, i) => {
      const tokens = vectorizer.tokenize(test.input);
      const valid = test.expected.every(word => tokens.includes(word));
      
      if (valid) {
        console.log(`✅ Test ${i + 1} passed`);
        passed++;
      } else {
        console.log(`❌ Test ${i + 1} failed`);
        console.log('  Input:', test.input);
        console.log('  Expected to include:', test.expected);
        console.log('  Got:', tokens);
      }
    });
    
    console.log(`\n📊 Results: ${passed}/${tests.length} passed\n`);
    return passed === tests.length;
  },
  
  /**
   * Test 2: TF-IDF calculation
   */
  test_tfidf() {
    console.log('🧪 Test 2: TF-IDF Calculation');
    
    const vectorizer = new RAGEngine.SimpleVectorizer();
    
    const docs = [
      'cat dog bird',
      'dog dog cat',
      'bird bird bird'
    ];
    
    const allTokens = docs.map(d => vectorizer.tokenize(d));
    vectorizer.computeIDF(allTokens);
    
    // Bird appears in 2 docs, should have lower IDF than terms in 1 doc
    const birdIDF = vectorizer.idf.get('bird');
    const catIDF = vectorizer.idf.get('cat');
    const dogIDF = vectorizer.idf.get('dog');
    
    console.log('IDF values:');
    console.log('  bird (in 2 docs):', birdIDF);
    console.log('  cat (in 2 docs):', catIDF);
    console.log('  dog (in 2 docs):', dogIDF);
    
    // All appear in 2 docs, should have same IDF
    const passed = Math.abs(birdIDF - catIDF) < 0.001 && 
                   Math.abs(catIDF - dogIDF) < 0.001;
    
    if (passed) {
      console.log('✅ Test passed\n');
    } else {
      console.log('❌ Test failed\n');
    }
    
    return passed;
  },
  
  /**
   * Test 3: Cosine similarity
   */
  test_similarity() {
    console.log('🧪 Test 3: Cosine Similarity');
    
    const vectorizer = new RAGEngine.SimpleVectorizer();
    
    // Identical vectors should have similarity = 1
    const vec1 = new Map([['cat', 0.5], ['dog', 0.5]]);
    const vec2 = new Map([['cat', 0.5], ['dog', 0.5]]);
    const sim1 = vectorizer.cosineSimilarity(vec1, vec2);
    
    console.log('Identical vectors similarity:', sim1);
    const test1 = Math.abs(sim1 - 1.0) < 0.001;
    
    // Orthogonal vectors should have similarity = 0
    const vec3 = new Map([['cat', 1.0]]);
    const vec4 = new Map([['dog', 1.0]]);
    const sim2 = vectorizer.cosineSimilarity(vec3, vec4);
    
    console.log('Orthogonal vectors similarity:', sim2);
    const test2 = Math.abs(sim2 - 0.0) < 0.001;
    
    const passed = test1 && test2;
    
    if (passed) {
      console.log('✅ Test passed\n');
    } else {
      console.log('❌ Test failed\n');
    }
    
    return passed;
  },
  
  /**
   * Test 4: Chunking
   */
  test_chunking() {
    console.log('🧪 Test 4: Chunking');
    
    const chunker = new RAGEngine.ChunkCreator(10, 3);
    
    const text = 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen.';
    const chunks = chunker.createChunks(text, { source: 'test' });
    
    console.log(`Created ${chunks.length} chunks`);
    
    const test1 = chunks.length > 1;
    const test2 = chunks.every(c => c.metadata.source === 'test');
    const test3 = chunks.every(c => c.wordCount > 0);
    
    const passed = test1 && test2 && test3;
    
    if (passed) {
      console.log('✅ Test passed\n');
    } else {
      console.log('❌ Test failed\n');
      console.log('  Multiple chunks:', test1);
      console.log('  Metadata preserved:', test2);
      console.log('  Word count set:', test3);
    }
    
    return passed;
  },
  
  /**
   * Test 5: URL Scoring
   */
  test_url_scoring() {
    console.log('🧪 Test 5: URL Scoring');
    
    const scorer = new RAGEngine.URLScorer();
    
    const urls = [
      'https://example.com/contact',
      'https://example.com/about',
      'https://example.com/pricing',
      'https://example.com/blog/random-article'
    ];
    
    // Question about contact should rank /contact highest
    const question = 'How do I contact support?';
    const ranked = scorer.rankURLs(urls, question, 3);
    
    console.log('Question:', question);
    console.log('Ranked URLs:', ranked);
    
    const passed = ranked[0].includes('contact');
    
    if (passed) {
      console.log('✅ Test passed - /contact ranked first\n');
    } else {
      console.log('❌ Test failed - /contact not ranked first\n');
    }
    
    return passed;
  },
  
  /**
   * Test 6: Full RAG workflow
   */
  async test_full_workflow() {
    console.log('🧪 Test 6: Full RAG Workflow');
    
    const rag = new RAGEngine.RAG();
    
    // Mock page content
    const content = `
      Welcome to our company. We offer great services.
      Our products are the best in the market.
      Contact us at support@example.com for more information.
      We have been in business since 2010.
    `;
    
    const metadata = {
      title: 'Test Page',
      url: 'https://example.com',
      source: 'test'
    };
    
    try {
      // Index
      await rag.indexPage(content, metadata);
      console.log('✅ Page indexed');
      
      // Retrieve
      const query = 'How can I contact you?';
      const chunks = rag.retrieve(query, 2);
      
      console.log(`Found ${chunks.length} chunks`);
      const hasContact = chunks.some(c => c.text.includes('contact') || c.text.includes('support@example.com'));
      
      if (hasContact) {
        console.log('✅ Test passed - Found relevant chunk\n');
        return true;
      } else {
        console.log('❌ Test failed - No relevant chunk found\n');
        return false;
      }
    } catch (error) {
      console.log('❌ Test failed with error:', error.message, '\n');
      return false;
    }
  },
  
  /**
   * Run all tests
   */
  async runAll() {
    console.log('🚀 Running RAG Engine Test Suite\n');
    console.log('=' .repeat(50));
    
    const results = {
      tokenization: this.test_tokenization(),
      tfidf: this.test_tfidf(),
      similarity: this.test_similarity(),
      chunking: this.test_chunking(),
      url_scoring: this.test_url_scoring(),
      full_workflow: await this.test_full_workflow()
    };
    
    console.log('=' .repeat(50));
    console.log('\n📊 Test Summary:\n');
    
    let passed = 0;
    let total = 0;
    
    Object.entries(results).forEach(([name, result]) => {
      total++;
      if (result) {
        passed++;
        console.log(`✅ ${name}: PASSED`);
      } else {
        console.log(`❌ ${name}: FAILED`);
      }
    });
    
    console.log(`\n🎯 Total: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('⚠️ Some tests failed');
    }
    
    return results;
  }
};

// Export
window.RAGTests = RAGTests;

console.log('🧪 RAG Tests loaded. Run: RAGTests.runAll()');

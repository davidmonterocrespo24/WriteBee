/**
 * AIService - Class to interact with Chrome AI APIs
 */
class AIService {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Checks if a specific API is available
   */
  async checkAvailability(apiName) {
    try {
      if (!self[apiName]) {
        console.warn(`❌ API ${apiName} not available`);
        return false;
      }
      const availability = await self[apiName].availability();

  return availability === 'available' || availability === 'downloadable';
    } catch (error) {
      console.error(`Error checking ${apiName}:`, error);
      return false;
    }
  }

  /**
   * Shows the download progress of the model
   */
  createMonitor(onProgress) {
    return (m) => {
      m.addEventListener('downloadprogress', (e) => {
        const percent = Math.round(e.loaded * 100);

        if (onProgress) {
          onProgress(percent);
        }
      });
    };
  }

  /**
   * Summarizes text using Summarizer API
   */
  async summarize(text, onProgress = null, options = {}) {
    try {
      if (!await this.checkAvailability('Summarizer')) {
        throw new Error('The Summarizer API is not available in this browser.');
      }

      const summarizer = await self.Summarizer.create({
        type: options.type || 'key-points',
        format: options.format || 'markdown',
        length: options.length || 'long',
        sharedContext: options.sharedContext || '',
        outputLanguage: 'en', // Specify output language to avoid warnings
        monitor: this.createMonitor(onProgress)
      });

      const result = await summarizer.summarize(text);
      summarizer.destroy();

      return result;
    } catch (error) {
      console.error('Error in summarize:', error);
      throw error;
    }
  }

  /**
   * Summarizes large text by chunking it into smaller parts
   * Uses a hierarchical summarization strategy with very small chunks
   */
  async summarizeLargeText(text, onProgress = null, options = {}) {
    try {
      if (!await this.checkAvailability('Summarizer')) {
        throw new Error('The Summarizer API is not available in this browser.');
      }

      // Very conservative chunk size (approximately 800-1000 tokens)
      const MAX_CHUNK_SIZE = 4000;
      const chunks = [];

      // Split text into manageable chunks
      if (text.length <= MAX_CHUNK_SIZE) {
        // Text is small enough, summarize directly
        return await this.summarize(text, onProgress, options);
      }

      // Split by sentences to avoid cutting mid-sentence
      const sentences = text.split(/(?<=[.!?])\s+/);
      let currentChunk = '';

      for (const sentence of sentences) {
        if ((currentChunk + sentence).length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }

      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      console.log(`📊 Hierarchical Summarization Strategy:`);
      console.log(`   - Original text: ${text.length} characters`);
      console.log(`   - Split into ${chunks.length} chunks of ~${MAX_CHUNK_SIZE} chars each`);
      console.log(`   - Strategy: Summarize each → Combine → Final summary`);

      // Level 1: Summarize each small chunk
      const level1Summaries = [];
      for (let i = 0; i < chunks.length; i++) {
        if (onProgress) {
          const percent = Math.round(((i + 1) / (chunks.length * 1.5)) * 100);
          onProgress(percent);
        }

        console.log(`   📝 Level 1: Chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);

        try {
          const summary = await this.summarize(chunks[i], null, {
            type: 'tldr', // Use shorter 'tldr' type for intermediate summaries
            format: 'plain-text',
            length: 'short',
            sharedContext: `Part ${i + 1} of ${chunks.length} of a video transcript.`,
            outputLanguage: 'en'
          });

          level1Summaries.push(summary);
          console.log(`   ✓ Chunk ${i + 1} summarized (${summary.length} chars)`);
        } catch (error) {
          console.error(`   ✗ Error summarizing chunk ${i + 1}:`, error.message);
          // Try to use a smaller portion of the chunk
          const halfChunk = chunks[i].substring(0, Math.floor(chunks[i].length / 2));
          try {
            const summary = await this.summarize(halfChunk, null, {
              type: 'tldr',
              format: 'plain-text',
              length: 'short',
              outputLanguage: 'en'
            });
            level1Summaries.push(summary);
            console.log(`   ✓ Chunk ${i + 1} (half) summarized`);
          } catch (retryError) {
            console.log(`   ⚠ Skipping chunk ${i + 1}`);
          }
        }

        // Delay between chunks
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      if (level1Summaries.length === 0) {
        throw new Error('Could not summarize any chunks');
      }

      console.log(`   ✓ Level 1 complete: ${level1Summaries.length} summaries created`);

      // Level 2: Combine all summaries
      const combinedText = level1Summaries.join(' ');
      console.log(`   📝 Level 2: Creating final summary (${combinedText.length} chars)`);

      if (onProgress) onProgress(90);

      // If combined is still too large, recursively summarize
      if (combinedText.length > MAX_CHUNK_SIZE) {
        console.log(`   ⚠ Combined summaries too large, applying recursive summarization`);
        return await this.summarizeLargeText(combinedText, onProgress, {
          type: 'key-points',
          format: 'markdown',
          length: 'long',
          sharedContext: 'Create a comprehensive summary from these partial summaries of a video.',
          outputLanguage: 'en'
        });
      }

      // Final summary with desired options
      const finalSummary = await this.summarize(combinedText, null, {
        type: options.type || 'key-points',
        format: options.format || 'markdown',
        length: options.length || 'long',
        sharedContext: 'Create a comprehensive summary from these partial summaries of a video transcript.',
        outputLanguage: 'en'
      });

      if (onProgress) onProgress(100);
      console.log(`   ✓ Final summary created (${finalSummary.length} chars)`);

      return finalSummary;

    } catch (error) {
      console.error('Error in summarizeLargeText:', error);
      throw error;
    }
  }

  /**
   * Summarizes text with streaming
   */
  async summarizeStream(text, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Summarizer')) {
  throw new Error('The Summarizer API is not available in this browser.');
      }

      console.log('🤖 AI TEXT SENT TO API (summarizeStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const summarizer = await self.Summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'long'
      });

      const stream = summarizer.summarizeStreaming(text, signal ? { signal } : {});
      let fullText = '';

      for await (const chunk of stream) {
        // Accumulate manually because the API returns deltas
        fullText += chunk;
        if (onChunk) onChunk(fullText);
      }

      summarizer.destroy();
      return fullText;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Streaming canceled');
      }
  console.error('Error in summarizeStream:', error);
      throw error;
    }
  }

  /**
   * Translates text using Translator API
   */
  async translate(text, targetLang, onProgress = null) {
    try {
      if (!await this.checkAvailability('Translator')) {
  throw new Error('The Translator API is not available in this browser.');
      }

  // Detect source language
      let sourceLang = 'en';
      if (await this.checkAvailability('LanguageDetector')) {
        const detector = await self.LanguageDetector.create({
          monitor: this.createMonitor(onProgress)
        });
        const detections = await detector.detect(text);
        if (detections.length > 0) {
          sourceLang = detections[0].detectedLanguage;
        }
        detector.destroy();
      }

      // Check availability of the language pair
      const availability = await self.Translator.availability({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      });

      if (availability !== 'available' && availability !== 'downloadable') {
  throw new Error(`The language pair ${sourceLang} -> ${targetLang} is not available.`);
      }

      const translator = await self.Translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        monitor: this.createMonitor(onProgress)
      });

      const result = await translator.translate(text);
      translator.destroy();

      return result;
    } catch (error) {
  console.error('Error in translate:', error);
      throw error;
    }
  }

  /**
   * Explains text using Prompt API
   */
  async explain(text, onProgress = null) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
  throw new Error('The Prompt API is not available in this browser.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor(onProgress)
      });

  const prompt = `Explain the following text clearly and concisely:\n\n${text}`;

      console.log('🤖 AI PROMPT SENT TO API:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(prompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const result = await session.prompt(prompt);

      session.destroy();
      return result;
    } catch (error) {
  console.error('Error in explain:', error);
      throw error;
    }
  }

  /**
   * Rewrites text using Rewriter API
   */
  async rewrite(text, onProgress = null) {
    try {
      if (!await this.checkAvailability('Rewriter')) {
  throw new Error('The Rewriter API is not available in this browser.');
      }

      const rewriter = await self.Rewriter.create({
        tone: 'as-is',
        length: 'as-is',
        monitor: this.createMonitor(onProgress)
      });

      const result = await rewriter.rewrite(text);
      rewriter.destroy();

      return result;
    } catch (error) {
  console.error('Error in rewrite:', error);
      throw error;
    }
  }

  /**
   * Expands text using Writer API
   */
  async expand(text, onProgress = null) {
    try {
      if (!await this.checkAvailability('Writer')) {
  throw new Error('The Writer API is not available in this browser.');
      }

      const writer = await self.Writer.create({
        tone: 'neutral',
        length: 'long',
        monitor: this.createMonitor(onProgress)
      });

  const prompt = `Expand the following text with more details and examples:\n\n${text}`;

      console.log('🤖 AI PROMPT SENT TO API (expand):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(prompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const result = await writer.write(prompt);
      writer.destroy();

      return result;
    } catch (error) {
  console.error('Error in expand:', error);
      throw error;
    }
  }

  /**
   * Answers questions using Prompt API
   */
  async answer(text, onProgress = null) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
  throw new Error('The Prompt API is not available in this browser.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor(onProgress)
      });

  const prompt = `Answer the following question clearly and precisely:\n\n${text}`;

      console.log('🤖 AI PROMPT SENT TO API (answer):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(prompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const result = await session.prompt(prompt);

      session.destroy();
      return result;
    } catch (error) {
  console.error('Error in answer:', error);
      throw error;
    }
  }

  /**
   * Processes chat messages with context
   */
  async chat(conversationHistory, onProgress = null) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
  throw new Error('The Prompt API is not available in this browser.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor(onProgress)
      });

      // Build the conversation context
      const context = conversationHistory.map(msg =>
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');

      const fullPrompt = context + '\n\nAssistant:';

      console.log('🤖 AI PROMPT SENT TO API (chat):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(fullPrompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const result = await session.prompt(fullPrompt);

      session.destroy();
      return result;
    } catch (error) {
  console.error('Error in chat:', error);
      throw error;
    }
  }

  /**
   * Streaming for long responses (optional)
   */
  async *streamResponse(text, action) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
  throw new Error('The Prompt API is not available in this browser.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor()
      });

      let prompt = '';
      switch (action) {
        case 'resumir':
          prompt = `Summarize the following text:\n\n${text}`;
          break;
        case 'explicar':
          prompt = `Explain clearly:\n\n${text}`;
          break;
        default:
          prompt = text;
      }

      const stream = session.promptStreaming(prompt);
      for await (const chunk of stream) {
        yield chunk;
      }

      session.destroy();
    } catch (error) {
  console.error('Error in streamResponse:', error);
      throw error;
    }
  }

  /**
   * Translates with streaming
   */
  async translateStream(text, targetLang, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Translator')) {
  throw new Error('The Translator API is not available in this browser.');
      }

  // Detect source language
      let sourceLang = 'en';
      if (await this.checkAvailability('LanguageDetector')) {
        const detector = await self.LanguageDetector.create();
        const detections = await detector.detect(text);
        if (detections.length > 0) {
          sourceLang = detections[0].detectedLanguage;
        }
        detector.destroy();
      }

      console.log('🤖 AI TEXT SENT TO API (translateStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Translation:', sourceLang, '→', targetLang);
      console.log('Text:', text);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const translator = await self.Translator.create({
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      });

      const stream = translator.translateStreaming(text, signal ? { signal } : {});
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk; // Accumulate deltas
        if (onChunk) onChunk(fullText);
      }

      translator.destroy();
      return fullText;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Streaming canceled');
      }
      console.error('Error in translateStream:', error);
      throw error;
    }
  }

  /**
   * Explains text using Prompt API with streaming
   */
  async explainStream(text, onChunk, signal = null) {
    try {
      if (!('LanguageModel' in self)) {
        throw new Error('The Prompt API is not available in this browser.');
      }

      const session = await self.LanguageModel.create();
      const prompt = `Explain the following text clearly and concisely in 3 key points:\n\n${text}`;

      console.log('🤖 AI PROMPT SENT TO API (explainStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(prompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const stream = session.promptStreaming(prompt, signal ? { signal } : {});
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk;
        if (onChunk) onChunk(fullText);
      }

      session.destroy();
      return fullText;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Streaming canceled');
      }
      console.error('Error in explainStream:', error);
      throw error;
    }
  }

  /**
   * Expands text using Writer API with streaming
   */
  async expandStream(text, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Writer')) {
  throw new Error('The Writer API is not available in this browser.');
      }

      const writer = await self.Writer.create({
        tone: 'neutral',
        length: 'long'
      });

  const prompt = `Expand the following text with more details and examples:\n\n${text}`;

      console.log('🤖 AI PROMPT SENT TO API (expandStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(prompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const stream = writer.writeStreaming(prompt, signal ? { signal } : {});
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk; // Accumulate deltas
        if (onChunk) onChunk(fullText);
      }

      writer.destroy();
      return fullText;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Streaming canceled');
      }
      console.error('Error in expandStream:', error);
      throw error;
    }
  }

  /**
   * Answers questions using Prompt API with streaming
   */
  async answerStream(text, onChunk, signal = null) {
    try {
      if (!('LanguageModel' in self)) {
        throw new Error('The Prompt API is not available in this browser.');
      }

      const session = await self.LanguageModel.create();
      const prompt = `Answer the following question briefly and precisely:\n\n${text}`;

      console.log('🤖 AI PROMPT SENT TO API (answerStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(prompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const stream = session.promptStreaming(prompt, signal ? { signal } : {});
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk;
        if (onChunk) onChunk(fullText);
      }

      session.destroy();
      return fullText;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Streaming canceled');
      }
      console.error('Error in answerStream:', error);
      throw error;
    }
  }

  /**
   * Rewrites text with streaming
   */
  async rewriteStream(text, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Rewriter')) {
  throw new Error('The Rewriter API is not available in this browser.');
      }

      console.log('🤖 AI TEXT SENT TO API (rewriteStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(text);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const rewriter = await self.Rewriter.create();
      const stream = rewriter.rewriteStreaming(text, signal ? { signal } : {});
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk; // Accumulate deltas
        if (onChunk) onChunk(fullText);
      }

      rewriter.destroy();
      return fullText;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Streaming canceled');
      }
      console.error('Error in rewriteStream:', error);
      throw error;
    }
  }

  /**
   * Writer API with streaming
   */
  async writeStream(prompt, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Writer')) {
  throw new Error('The Writer API is not available in this browser.');
      }

      console.log('🤖 AI PROMPT SENT TO API (writeStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(prompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const writer = await self.Writer.create();
      const stream = writer.writeStreaming(prompt, signal ? { signal } : {});
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk; // Accumulate deltas
        if (onChunk) onChunk(fullText);
      }

      writer.destroy();
      return fullText;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Streaming canceled');
      }
      console.error('Error in writeStream:', error);
      throw error;
    }
  }

  /**
   * Destroys all active sessions
   */
  cleanup() {
    for (const [key, session] of this.sessions) {
      if (session && session.destroy) {
        session.destroy();
      }
    }
    this.sessions.clear();
  }
}

// Export as singleton
const aiServiceInstance = new AIService();
window.AIServiceInstance = aiServiceInstance;



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
  console.log(`📊 ${apiName} availability:`, availability);
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
        console.log(`📥 Downloading model: ${percent}%`);
        if (onProgress) {
          onProgress(percent);
        }
      });
    };
  }

  /**
   * Summarizes text using Summarizer API
   */
  async summarize(text, onProgress = null) {
    try {
      if (!await this.checkAvailability('Summarizer')) {
  throw new Error('The Summarizer API is not available in this browser.');
      }

      const summarizer = await self.Summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'long',
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
   * Summarizes text with streaming
   */
  async summarizeStream(text, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Summarizer')) {
  throw new Error('The Summarizer API is not available in this browser.');
      }

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

      const result = await session.prompt(context + '\n\nAssistant:');

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

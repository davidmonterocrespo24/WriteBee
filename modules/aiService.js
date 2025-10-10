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
        console.warn(`❌ API ${apiName} no disponible`);
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
        throw new Error('La API Summarizer no está disponible en este navegador.');
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
      console.error('Error en summarize:', error);
      throw error;
    }
  }

  /**
   * Summarizes text with streaming
   */
  async summarizeStream(text, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Summarizer')) {
        throw new Error('La API Summarizer no está disponible en este navegador.');
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
      console.error('Error en summarizeStream:', error);
      throw error;
    }
  }

  /**
   * Translates text using Translator API
   */
  async translate(text, targetLang, onProgress = null) {
    try {
      if (!await this.checkAvailability('Translator')) {
        throw new Error('La API Translator no está disponible en este navegador.');
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
        throw new Error(`El par de idiomas ${sourceLang} -> ${targetLang} no está disponible.`);
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
      console.error('Error en translate:', error);
      throw error;
    }
  }

  /**
   * Explains text using Prompt API
   */
  async explain(text, onProgress = null) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
        throw new Error('La Prompt API no está disponible en este navegador.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor(onProgress)
      });

      const prompt = `Explica de manera clara y concisa el siguiente texto:\n\n${text}`;
      const result = await session.prompt(prompt);

      session.destroy();
      return result;
    } catch (error) {
      console.error('Error en explain:', error);
      throw error;
    }
  }

  /**
   * Rewrites text using Rewriter API
   */
  async rewrite(text, onProgress = null) {
    try {
      if (!await this.checkAvailability('Rewriter')) {
        throw new Error('La API Rewriter no está disponible en este navegador.');
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
      console.error('Error en rewrite:', error);
      throw error;
    }
  }

  /**
   * Expands text using Writer API
   */
  async expand(text, onProgress = null) {
    try {
      if (!await this.checkAvailability('Writer')) {
        throw new Error('La API Writer no está disponible en este navegador.');
      }

      const writer = await self.Writer.create({
        tone: 'neutral',
        length: 'long',
        monitor: this.createMonitor(onProgress)
      });

      const prompt = `Expande el siguiente texto con más detalles y ejemplos:\n\n${text}`;
      const result = await writer.write(prompt);
      writer.destroy();

      return result;
    } catch (error) {
      console.error('Error en expand:', error);
      throw error;
    }
  }

  /**
   * Answers questions using Prompt API
   */
  async answer(text, onProgress = null) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
        throw new Error('La Prompt API no está disponible en este navegador.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor(onProgress)
      });

      const prompt = `Responde la siguiente pregunta de manera clara y precisa:\n\n${text}`;
      const result = await session.prompt(prompt);

      session.destroy();
      return result;
    } catch (error) {
      console.error('Error en answer:', error);
      throw error;
    }
  }

  /**
   * Processes chat messages with context
   */
  async chat(conversationHistory, onProgress = null) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
        throw new Error('La Prompt API no está disponible en este navegador.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor(onProgress)
      });

      // Build the conversation context
      const context = conversationHistory.map(msg =>
        `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
      ).join('\n\n');

      const result = await session.prompt(context + '\n\nAsistente:');

      session.destroy();
      return result;
    } catch (error) {
      console.error('Error en chat:', error);
      throw error;
    }
  }

  /**
   * Streaming for long responses (optional)
   */
  async *streamResponse(text, action) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
        throw new Error('La Prompt API no está disponible en este navegador.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor()
      });

      let prompt = '';
      switch (action) {
        case 'resumir':
          prompt = `Resume el siguiente texto:\n\n${text}`;
          break;
        case 'explicar':
          prompt = `Explica de manera clara:\n\n${text}`;
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
      console.error('Error en streamResponse:', error);
      throw error;
    }
  }

  /**
   * Translates with streaming
   */
  async translateStream(text, targetLang, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Translator')) {
        throw new Error('La API Translator no está disponible en este navegador.');
      }

      // Detectar idioma de origen
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
      console.error('Error en translateStream:', error);
      throw error;
    }
  }

  /**
   * Explains text using Prompt API with streaming
   */
  async explainStream(text, onChunk, signal = null) {
    try {
      if (!('LanguageModel' in self)) {
        throw new Error('La API Prompt no está disponible en este navegador.');
      }

      const session = await self.LanguageModel.create();
      const prompt = `Explica el siguiente texto de forma clara y concisa en 3 puntos clave:\n\n${text}`;
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
      console.error('Error en explainStream:', error);
      throw error;
    }
  }

  /**
   * Expands text using Writer API with streaming
   */
  async expandStream(text, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Writer')) {
        throw new Error('La API Writer no está disponible en este navegador.');
      }

      const writer = await self.Writer.create({
        tone: 'neutral',
        length: 'long'
      });

      const prompt = `Amplía el siguiente texto con más detalles y ejemplos:\n\n${text}`;
      const stream = writer.writeStreaming(prompt, signal ? { signal } : {});
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk; // Acumular deltas
        if (onChunk) onChunk(fullText);
      }

      writer.destroy();
      return fullText;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Streaming canceled');
      }
      console.error('Error en expandStream:', error);
      throw error;
    }
  }

  /**
   * Answers questions using Prompt API with streaming
   */
  async answerStream(text, onChunk, signal = null) {
    try {
      if (!('LanguageModel' in self)) {
        throw new Error('La API Prompt no está disponible en este navegador.');
      }

      const session = await self.LanguageModel.create();
      const prompt = `Responde de forma breve y precisa a la siguiente pregunta:\n\n${text}`;
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
      console.error('Error en answerStream:', error);
      throw error;
    }
  }

  /**
   * Rewrites text with streaming
   */
  async rewriteStream(text, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Rewriter')) {
        throw new Error('La API Rewriter no está disponible en este navegador.');
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
      console.error('Error en rewriteStream:', error);
      throw error;
    }
  }

  /**
   * Writer API with streaming
   */
  async writeStream(prompt, onChunk, signal = null) {
    try {
      if (!await this.checkAvailability('Writer')) {
        throw new Error('La API Writer no está disponible en este navegador.');
      }

      const writer = await self.Writer.create();
      const stream = writer.writeStreaming(prompt, signal ? { signal } : {});
      let fullText = '';

      for await (const chunk of stream) {
        fullText += chunk; // Acumular deltas
        if (onChunk) onChunk(fullText);
      }

      writer.destroy();
      return fullText;
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Streaming canceled');
      }
      console.error('Error en writeStream:', error);
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

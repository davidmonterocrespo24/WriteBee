/**
 * AIService - Clase para interactuar con las APIs de Chrome AI
 */
class AIService {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Verifica si una API específica está disponible
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
   * Muestra el progreso de descarga del modelo
   */
  createMonitor() {
    return (m) => {
      m.addEventListener('downloadprogress', (e) => {
        console.log(`📥 Descargando modelo: ${Math.round(e.loaded * 100)}%`);
      });
    };
  }

  /**
   * Resume texto usando Summarizer API
   */
  async summarize(text) {
    try {
      if (!await this.checkAvailability('Summarizer')) {
        throw new Error('La API Summarizer no está disponible en este navegador.');
      }

      const summarizer = await self.Summarizer.create({
        type: 'key-points',
        format: 'markdown',
        length: 'short',
        monitor: this.createMonitor()
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
   * Traduce texto usando Translator API
   */
  async translate(text, targetLang) {
    try {
      if (!await this.checkAvailability('Translator')) {
        throw new Error('La API Translator no está disponible en este navegador.');
      }

      // Detectar idioma de origen
      let sourceLang = 'en';
      if (await this.checkAvailability('LanguageDetector')) {
        const detector = await self.LanguageDetector.create({
          monitor: this.createMonitor()
        });
        const detections = await detector.detect(text);
        if (detections.length > 0) {
          sourceLang = detections[0].detectedLanguage;
        }
        detector.destroy();
      }

      // Verificar disponibilidad del par de idiomas
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
        monitor: this.createMonitor()
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
   * Explica texto usando Prompt API
   */
  async explain(text) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
        throw new Error('La Prompt API no está disponible en este navegador.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor()
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
   * Corrige gramática usando Proofreader API
   */
  async checkGrammar(text) {
    try {
      if (!await this.checkAvailability('Proofreader')) {
        throw new Error('La API Proofreader no está disponible en este navegador.');
      }

      const proofreader = await self.Proofreader.create({
        expectedInputLanguages: ['en', 'es'],
        monitor: this.createMonitor()
      });

      const result = await proofreader.proofread(text);
      proofreader.destroy();

      // Formatear el resultado
      if (result.corrections.length === 0) {
        return '✅ No se encontraron errores gramaticales.';
      }

      let output = `**Texto corregido:**\n${result.corrected}\n\n**Correcciones:**\n`;
      for (const correction of result.corrections) {
        const original = text.substring(correction.startIndex, correction.endIndex);
        output += `- "${original}" → "${correction.correction}"\n`;
      }

      return output;
    } catch (error) {
      console.error('Error en checkGrammar:', error);
      throw error;
    }
  }

  /**
   * Reescribe texto usando Rewriter API
   */
  async rewrite(text) {
    try {
      if (!await this.checkAvailability('Rewriter')) {
        throw new Error('La API Rewriter no está disponible en este navegador.');
      }

      const rewriter = await self.Rewriter.create({
        tone: 'as-is',
        length: 'as-is',
        monitor: this.createMonitor()
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
   * Expande texto usando Writer API
   */
  async expand(text) {
    try {
      if (!await this.checkAvailability('Writer')) {
        throw new Error('La API Writer no está disponible en este navegador.');
      }

      const writer = await self.Writer.create({
        tone: 'neutral',
        length: 'long',
        monitor: this.createMonitor()
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
   * Responde preguntas usando Prompt API
   */
  async answer(text) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
        throw new Error('La Prompt API no está disponible en este navegador.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor()
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
   * Procesa mensajes de chat con contexto
   */
  async chat(conversationHistory) {
    try {
      if (!await this.checkAvailability('LanguageModel')) {
        throw new Error('La Prompt API no está disponible en este navegador.');
      }

      const session = await self.LanguageModel.create({
        monitor: this.createMonitor()
      });

      // Construir el contexto de la conversación
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
   * Streaming para respuestas largas (opcional)
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
   * Destruye todas las sesiones activas
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

// Exportar como singleton
const aiServiceInstance = new AIService();
window.AIServiceInstance = aiServiceInstance;

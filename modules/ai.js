const AIModule = (function() {
  // Obtener instancia del servicio de AI
  const getAIService = () => window.AIServiceInstance;

  async function aiSummarize(text) {
    try {
      const service = getAIService();
      return await service.summarize(text);
    } catch (error) {
      console.error('Error en aiSummarize:', error);
      return `❌ Error al resumir: ${error.message}`;
    }
  }

  async function aiTranslate(text, targetLang) {
    try {
      const service = getAIService();
      return await service.translate(text, targetLang);
    } catch (error) {
      console.error('Error en aiTranslate:', error);
      return `❌ Error al traducir: ${error.message}`;
    }
  }

  async function aiExplain(text) {
    try {
      const service = getAIService();
      return await service.explain(text);
    } catch (error) {
      console.error('Error en aiExplain:', error);
      return `❌ Error al explicar: ${error.message}`;
    }
  }

  async function aiGrammar(text) {
    try {
      const service = getAIService();
      return await service.checkGrammar(text);
    } catch (error) {
      console.error('Error en aiGrammar:', error);
      return `❌ Error al revisar gramática: ${error.message}`;
    }
  }

  async function aiRewrite(text) {
    try {
      const service = getAIService();
      return await service.rewrite(text);
    } catch (error) {
      console.error('Error en aiRewrite:', error);
      return `❌ Error al reescribir: ${error.message}`;
    }
  }

  async function aiExpand(text) {
    try {
      const service = getAIService();
      return await service.expand(text);
    } catch (error) {
      console.error('Error en aiExpand:', error);
      return `❌ Error al expandir: ${error.message}`;
    }
  }

  async function aiAnswer(text) {
    try {
      const service = getAIService();
      return await service.answer(text);
    } catch (error) {
      console.error('Error en aiAnswer:', error);
      return `❌ Error al responder: ${error.message}`;
    }
  }

  async function aiChat(conversationHistory) {
    try {
      const service = getAIService();
      return await service.chat(conversationHistory);
    } catch (error) {
      console.error('Error en aiChat:', error);
      return `❌ Error en chat: ${error.message}`;
    }
  }

  return {
    aiSummarize,
    aiTranslate,
    aiExplain,
    aiGrammar,
    aiRewrite,
    aiExpand,
    aiAnswer,
    aiChat
  };
})();

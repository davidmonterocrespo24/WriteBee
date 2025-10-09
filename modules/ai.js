const AIModule = (function() {
  // Get AI service instance
  const getAIService = () => window.AIServiceInstance;

  async function aiSummarize(text, onProgress = null) {
    try {
      const service = getAIService();
      return await service.summarize(text, onProgress);
    } catch (error) {
      console.error('Error in aiSummarize:', error);
      return `✕ Error summarizing: ${error.message}`;
    }
  }

  async function aiTranslate(text, targetLang, onProgress = null) {
    try {
      const service = getAIService();
      return await service.translate(text, targetLang, onProgress);
    } catch (error) {
      console.error('Error in aiTranslate:', error);
      return `✕ Error translating: ${error.message}`;
    }
  }

  async function aiExplain(text, onProgress = null) {
    try {
      const service = getAIService();
      return await service.explain(text, onProgress);
    } catch (error) {
      console.error('Error in aiExplain:', error);
      return `✕ Error explaining: ${error.message}`;
    }
  }

  async function aiGrammar(text, onProgress = null) {
    try {
      const service = getAIService();
      return await service.checkGrammar(text, onProgress);
    } catch (error) {
      console.error('Error in aiGrammar:', error);
      return `✕ Error checking grammar: ${error.message}`;
    }
  }

  async function aiRewrite(text, onProgress = null) {
    try {
      const service = getAIService();
      return await service.rewrite(text, onProgress);
    } catch (error) {
      console.error('Error in aiRewrite:', error);
      return `✕ Error rewriting: ${error.message}`;
    }
  }

  async function aiExpand(text, onProgress = null) {
    try {
      const service = getAIService();
      return await service.expand(text, onProgress);
    } catch (error) {
      console.error('Error in aiExpand:', error);
      return `✕ Error expanding: ${error.message}`;
    }
  }

  async function aiAnswer(text, onProgress = null) {
    try {
      const service = getAIService();
      return await service.answer(text, onProgress);
    } catch (error) {
      console.error('Error in aiAnswer:', error);
      return `✕ Error answering: ${error.message}`;
    }
  }

  async function aiChat(conversationHistory, onProgress = null) {
    try {
      const service = getAIService();
      return await service.chat(conversationHistory, onProgress);
    } catch (error) {
      console.error('Error in aiChat:', error);
      return `✕ Error in chat: ${error.message}`;
    }
  }

  async function aiPrompt(prompt, onProgress = null) {
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🤖 AI PROMPT: Calling LanguageModel API');
      console.log('📊 Prompt length:', prompt.length, 'characters');
      
      // Check if prompt is too large
      if (prompt.length > 4000) {
        console.warn('⚠️ AI PROMPT: Warning - Prompt is very large:', prompt.length, 'chars (recommended: < 4000)');
      }
      
      console.log('📝 Prompt preview (first 300 chars):');
      console.log(prompt.substring(0, 300) + '...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      const service = getAIService();
      // Use the LanguageModel API directly for general prompts
      if (!('LanguageModel' in self)) {
        throw new Error('LanguageModel API not available');
      }
      
      console.log('🔧 AI PROMPT: Creating LanguageModel session...');
      const session = await self.LanguageModel.create({
        monitor: service.createMonitor(onProgress)
      });
      
      console.log('✅ AI PROMPT: Session created, sending prompt...');
      const result = await session.prompt(prompt);
      
      console.log('✅ AI PROMPT: Response received');
      console.log('📊 Response length:', result.length, 'characters');
      console.log('📝 Response preview (first 200 chars):');
      console.log(result.substring(0, 200) + '...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      session.destroy();
      
      return result;
    } catch (error) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ AI PROMPT: ERROR');
      console.error('Error message:', error.message);
      console.error('Error details:', error);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // Provide more helpful error messages
      if (error.message && error.message.toLowerCase().includes('too larg')) {
        throw new Error('The input is too large. The prompt has ' + prompt.length + ' characters. Please try a more specific question.');
      }
      
      throw error;
    }
  }

  // Streaming functions
  async function aiSummarizeStream(text, onChunk, signal = null) {
    try {
      const service = getAIService();
      return await service.summarizeStream(text, onChunk, signal);
    } catch (error) {
      console.error('Error in aiSummarizeStream:', error);
      throw error;
    }
  }

  async function aiRewriteStream(text, onChunk, signal = null) {
    try {
      const service = getAIService();
      return await service.rewriteStream(text, onChunk, signal);
    } catch (error) {
      console.error('Error in aiRewriteStream:', error);
      throw error;
    }
  }

  async function aiWriteStream(prompt, onChunk, signal = null) {
    try {
      const service = getAIService();
      return await service.writeStream(prompt, onChunk, signal);
    } catch (error) {
      console.error('Error in aiWriteStream:', error);
      throw error;
    }
  }

  async function aiTranslateStream(text, targetLang, onChunk, signal = null) {
    try {
      const service = getAIService();
      return await service.translateStream(text, targetLang, onChunk, signal);
    } catch (error) {
      console.error('Error in aiTranslateStream:', error);
      throw error;
    }
  }

  async function aiExplainStream(text, onChunk, signal = null) {
    try {
      const service = getAIService();
      return await service.explainStream(text, onChunk, signal);
    } catch (error) {
      console.error('Error in aiExplainStream:', error);
      throw error;
    }
  }

  async function aiExpandStream(text, onChunk, signal = null) {
    try {
      const service = getAIService();
      return await service.expandStream(text, onChunk, signal);
    } catch (error) {
      console.error('Error in aiExpandStream:', error);
      throw error;
    }
  }

  async function aiAnswerStream(text, onChunk, signal = null) {
    try {
      const service = getAIService();
      return await service.answerStream(text, onChunk, signal);
    } catch (error) {
      console.error('Error in aiAnswerStream:', error);
      throw error;
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
    aiChat,
    aiPrompt,
    // Streaming
    aiSummarizeStream,
    aiRewriteStream,
    aiWriteStream,
    aiTranslateStream,
    aiExplainStream,
    aiExpandStream,
    aiAnswerStream
  };
})();

// Export
if (typeof window !== 'undefined') {
  window.AIModule = AIModule;
}

const AIModule = (function() {
  // Get AI service instance
  const getAIService = () => window.AIServiceInstance;

  async function aiSummarize(text, onProgress = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiSummarize):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      // Check if text is too large and use chunking strategy
      if (text.length > 15000) {
        console.log('Text is large, using chunked summarization strategy');
        return await service.summarizeLargeText(text, onProgress);
      }
      return await service.summarize(text, onProgress);
    } catch (error) {
      console.error('Error in aiSummarize:', error);
      // If error is about quota, try chunking
      if (error.message && error.message.toLowerCase().includes('too large')) {
        try {
          console.log('Retrying with chunked summarization');
          const service = getAIService();
          return await service.summarizeLargeText(text, onProgress);
        } catch (retryError) {
          return `✕ Error summarizing: ${retryError.message}`;
        }
      }
      return `✕ Error summarizing: ${error.message}`;
    }
  }

  async function aiTranslate(text, targetLang, onProgress = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiTranslate):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Target language:', targetLang);
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.translate(text, targetLang, onProgress);
    } catch (error) {
      console.error('Error in aiTranslate:', error);
      return `✕ Error translating: ${error.message}`;
    }
  }

  async function aiExplain(text, onProgress = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiExplain):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.explain(text, onProgress);
    } catch (error) {
      console.error('Error in aiExplain:', error);
      return `✕ Error explaining: ${error.message}`;
    }
  }

  async function aiRewrite(text, onProgress = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiRewrite):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.rewrite(text, onProgress);
    } catch (error) {
      console.error('Error in aiRewrite:', error);
      return `✕ Error rewriting: ${error.message}`;
    }
  }

  async function aiExpand(text, onProgress = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiExpand):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.expand(text, onProgress);
    } catch (error) {
      console.error('Error in aiExpand:', error);
      return `✕ Error expanding: ${error.message}`;
    }
  }

  async function aiAnswer(text, onProgress = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiAnswer):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.answer(text, onProgress);
    } catch (error) {
      console.error('Error in aiAnswer:', error);
      return `✕ Error answering: ${error.message}`;
    }
  }

  async function aiChat(conversationHistory, onProgress = null) {
    try {
      const totalLength = conversationHistory.reduce((sum, msg) => sum + msg.content.length, 0);
      console.log('🤖 AI INPUT SENT TO API (aiChat):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Conversation history length:', conversationHistory.length, 'messages');
      console.log('Total text length:', totalLength, 'characters, ~' + Math.ceil(totalLength / 4) + ' tokens');
      conversationHistory.forEach((msg, i) => {
        console.log(`Message ${i + 1} (${msg.role}):`, msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : ''));
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.chat(conversationHistory, onProgress);
    } catch (error) {
      console.error('Error in aiChat:', error);
      return `✕ Error in chat: ${error.message}`;
    }
  }

  async function aiPrompt(prompt, onProgress = null) {
    try {



      // Check if prompt is too large
      if (prompt.length > 4000) {
        console.warn('⚠️ AI PROMPT: Warning - Prompt is very large:', prompt.length, 'chars (recommended: < 4000)');
      }

      // Log the complete prompt
      console.log('🤖 AI PROMPT SENT TO API (aiPrompt):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(prompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Prompt stats: ' + prompt.length + ' characters, ~' + Math.ceil(prompt.length / 4) + ' tokens');

      const service = getAIService();
      // Use the LanguageModel API directly for general prompts
      if (!('LanguageModel' in self)) {
        throw new Error('LanguageModel API not available');
      }

      const session = await self.LanguageModel.create({
        monitor: service.createMonitor(onProgress)
      });

      const result = await session.prompt(prompt);





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
      console.log('🤖 AI INPUT SENT TO API (aiSummarizeStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.summarizeStream(text, onChunk, signal);
    } catch (error) {
      console.error('Error in aiSummarizeStream:', error);
      throw error;
    }
  }

  async function aiRewriteStream(text, onChunk, signal = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiRewriteStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.rewriteStream(text, onChunk, signal);
    } catch (error) {
      console.error('Error in aiRewriteStream:', error);
      throw error;
    }
  }

  async function aiWriteStream(prompt, onChunk, signal = null) {
    try {
      console.log('🤖 AI PROMPT SENT TO API (aiWriteStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(prompt);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 Prompt stats: ' + prompt.length + ' characters, ~' + Math.ceil(prompt.length / 4) + ' tokens');

      const service = getAIService();
      return await service.writeStream(prompt, onChunk, signal);
    } catch (error) {
      console.error('Error in aiWriteStream:', error);
      throw error;
    }
  }

  async function aiTranslateStream(text, targetLang, onChunk, signal = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiTranslateStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Target language:', targetLang);
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.translateStream(text, targetLang, onChunk, signal);
    } catch (error) {
      console.error('Error in aiTranslateStream:', error);
      throw error;
    }
  }

  async function aiExplainStream(text, onChunk, signal = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiExplainStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.explainStream(text, onChunk, signal);
    } catch (error) {
      console.error('Error in aiExplainStream:', error);
      throw error;
    }
  }

  async function aiExpandStream(text, onChunk, signal = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiExpandStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const service = getAIService();
      return await service.expandStream(text, onChunk, signal);
    } catch (error) {
      console.error('Error in aiExpandStream:', error);
      throw error;
    }
  }

  async function aiAnswerStream(text, onChunk, signal = null) {
    try {
      console.log('🤖 AI INPUT SENT TO API (aiAnswerStream):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Text length:', text.length, 'characters, ~' + Math.ceil(text.length / 4) + ' tokens');
      console.log('First 500 chars:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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



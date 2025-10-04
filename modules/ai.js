const AIModule = (function() {
  async function aiSummarize(text) {
    if (!window.ai || !window.ai.languageModel) {
      return 'La API de AI de Chrome no está disponible. Asegúrate de usar Chrome Canary con los flags habilitados.';
    }

    const session = await window.ai.languageModel.create();
    const result = await session.prompt(`Resume el siguiente texto de manera concisa:\n\n${text}`);
    return result;
  }

  async function aiTranslate(text, targetLang) {
    if (!window.ai || !window.ai.languageModel) {
      return 'La API de AI de Chrome no está disponible.';
    }

    const langNames = {
      es: 'español', en: 'inglés', fr: 'francés', de: 'alemán',
      it: 'italiano', pt: 'portugués', ja: 'japonés', zh: 'chino'
    };

    const session = await window.ai.languageModel.create();
    const result = await session.prompt(`Traduce el siguiente texto a ${langNames[targetLang]}:\n\n${text}`);
    return result;
  }

  async function aiExplain(text) {
    if (!window.ai || !window.ai.languageModel) {
      return 'La API de AI de Chrome no está disponible.';
    }

    const session = await window.ai.languageModel.create();
    const result = await session.prompt(`Explica detalladamente el siguiente texto:\n\n${text}`);
    return result;
  }

  async function aiGrammar(text) {
    if (!window.ai || !window.ai.languageModel) {
      return 'La API de AI de Chrome no está disponible.';
    }

    const session = await window.ai.languageModel.create();
    const result = await session.prompt(`Corrige los errores gramaticales y mejora el siguiente texto:\n\n${text}`);
    return result;
  }

  async function aiRewrite(text) {
    if (!window.ai || !window.ai.languageModel) {
      return 'La API de AI de Chrome no está disponible.';
    }

    const session = await window.ai.languageModel.create();
    const result = await session.prompt(`Reescribe el siguiente texto de manera diferente manteniendo el significado:\n\n${text}`);
    return result;
  }

  async function aiExpand(text) {
    if (!window.ai || !window.ai.languageModel) {
      return 'La API de AI de Chrome no está disponible.';
    }

    const session = await window.ai.languageModel.create();
    const result = await session.prompt(`Expande y elabora más sobre el siguiente texto:\n\n${text}`);
    return result;
  }

  async function aiAnswer(text) {
    if (!window.ai || !window.ai.languageModel) {
      return 'La API de AI de Chrome no está disponible.';
    }

    const session = await window.ai.languageModel.create();
    const result = await session.prompt(`Responde a la siguiente pregunta:\n\n${text}`);
    return result;
  }

  return {
    aiSummarize,
    aiTranslate,
    aiExplain,
    aiGrammar,
    aiRewrite,
    aiExpand,
    aiAnswer
  };
})();

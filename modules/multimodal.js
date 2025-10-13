const MultimodalModule = (function() {
  let session = null;
  let audioSession = null;

  /**
   * Inicializar sesión multimodal para imágenes
   */
  async function initImageSession() {
    if (!('LanguageModel' in self)) {
      throw new Error('Este navegador no soporta la API de lenguaje multimodal');
    }

    const availability = await LanguageModel.availability({
      expectedInputs: [{ type: "image" }],
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    });

    if (availability === "unavailable") {
      throw new Error("Modelo multimodal no disponible en este dispositivo");
    }

    if (!session) {
      session = await LanguageModel.create({
        expectedInputs: [{ type: "image" }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
        initialPrompts: [
          {
            role: "system",
            content: "You are an expert assistant in visual analysis. You describe images clearly, precisely, and helpfully. You can generate alt text, summarize visual content, translate text in images, and answer questions about what you see."
          }
        ],
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {

          });
        }
      });
    }

    return session;
  }

  /**
   * Inicializar sesión multimodal para audio
   */
  async function initAudioSession() {
    if (!('LanguageModel' in self)) {
      throw new Error('Este navegador no soporta la API de lenguaje multimodal');
    }

    const availability = await LanguageModel.availability({
      expectedInputs: [{ type: "audio" }],
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    });

    if (availability === "unavailable") {
      throw new Error("Modelo de audio no disponible en este dispositivo");
    }

    if (!audioSession) {
      audioSession = await LanguageModel.create({
        expectedInputs: [{ type: "audio" }],
        expectedOutputs: [{ type: "text", languages: ["en"] }],
        initialPrompts: [
          {
            role: "system",
            content: "You are an expert transcriber and summarizer. You transcribe audio with precision, correct filler words, and can summarize or answer questions about spoken content."
          }
        ],
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {

          });
        }
      });
    }

    return audioSession;
  }

  /**
   * Describir una imagen
   * @param {File|Blob} imageFile - Archivo de imagen
   * @param {string} prompt - Instrucción opcional (ej: "Describe la imagen", "Genera alt text")
   * @param {function} onProgress - Callback para streaming
   */
  async function describeImage(imageFile, prompt = "Describe the image in detail.", onProgress = null) {
    try {
      const sess = await initImageSession();

      // Adjuntar imagen
      await sess.append([
        {
          role: "user",
          content: [
            { type: "image", value: imageFile }
          ]
        }
      ]);

      // Hacer streaming del resultado
      if (onProgress) {
        const stream = sess.promptStreaming(prompt);
        let fullText = "";
        for await (const chunk of stream) {
          fullText += chunk;
          onProgress(fullText);
        }
        return fullText;
      } else {
        return await sess.prompt(prompt);
      }
    } catch (error) {
      console.error('Error al describir imagen:', error);
      throw error;
    }
  }

  /**
   * Procesar imagen con contexto (para acciones como resumir, traducir, etc.)
   * @param {File|Blob} imageFile - Archivo de imagen
   * @param {string} action - Acción a realizar (summarize, translate, explain, answer, etc.)
   * @param {string} context - Contexto adicional
   * @param {function} onProgress - Callback para streaming
   */
  async function processImageWithAction(imageFile, action, context = "", onProgress = null) {
    const prompts = {
      ocr: "Extract all visible text from this image. Return ONLY the extracted text, nothing else. If there's no text, say 'No text found'.",
      summarize: "Summarize the visible content in this image concisely.",
      translate: `Translate all visible text in this image to ${context || 'English'}.`,
      explain: "Explain what this image shows in detail.",
      expand: "Describe this image in detail, expanding on all visible elements.",
      answer: `Answer this question about the image: ${context}`,
      rewrite: "Rewrite the visible text in this image in a clearer and more professional way.",
      alttext: "Generate a short and descriptive alt text for this image (maximum 125 characters)."
    };

    const prompt = prompts[action] || prompts.explain;
    return await describeImage(imageFile, prompt, onProgress);
  }

  /**
   * Transcribir audio
   * @param {Blob} audioBlob - Audio en formato blob
   * @param {string} mode - Modo: 'transcribe' o 'summary'
   * @param {function} onProgress - Callback para streaming
   */
  async function transcribeAudio(audioBlob, mode = 'transcribe', onProgress = null) {
    try {
      const sess = await initAudioSession();

      const instruction = mode === 'summary'
        ? "Summarize the spoken content in a clear and concise paragraph."
        : "Transcribe the audio faithfully to English, correcting filler words and unnecessary pauses.";

      // Adjuntar audio
      await sess.append([
        {
          role: "user",
          content: [
            { type: "text", value: `Instrucción: ${instruction}` },
            { type: "audio", value: audioBlob }
          ]
        }
      ]);

      const question = mode === 'summary'
        ? "Return only the summary."
        : "Return only the transcription.";

      // Hacer streaming del resultado
      if (onProgress) {
        const stream = sess.promptStreaming(question);
        let fullText = "";
        for await (const chunk of stream) {
          fullText += chunk;
          onProgress(fullText);
        }
        return fullText;
      } else {
        return await sess.prompt(question);
      }
    } catch (error) {
      console.error('Error al transcribir audio:', error);
      throw error;
    }
  }

  /**
   * Procesar audio con acción específica
   * @param {Blob} audioBlob - Audio en formato blob
   * @param {string} action - Acción a realizar
   * @param {string} context - Contexto adicional
   * @param {function} onProgress - Callback para streaming
   */
  async function processAudioWithAction(audioBlob, action, context = "", onProgress = null) {
    try {
      const sess = await initAudioSession();

      const prompts = {
        summarize: "Transcribe and summarize the audio content concisely.",
        translate: `Transcribe the audio and translate it to ${context || 'English'}.`,
        explain: "Transcribe the audio and explain the main concepts mentioned.",
        expand: "Transcribe the audio and expand on the main points mentioned.",
        answer: `Transcribe the audio and answer: ${context}`,
        rewrite: "Transcribe the audio and rewrite it in a clearer and more professional way.",
        transcribe: "Transcribe the audio faithfully."
      };

      const instruction = prompts[action] || prompts.transcribe;

      await sess.append([
        {
          role: "user",
          content: [
            { type: "text", value: `Instrucción: ${instruction}` },
            { type: "audio", value: audioBlob }
          ]
        }
      ]);

      // Hacer streaming del resultado
      if (onProgress) {
        const stream = sess.promptStreaming("Process the audio according to the instruction.");
        let fullText = "";
        for await (const chunk of stream) {
          fullText += chunk;
          onProgress(fullText);
        }
        return fullText;
      } else {
        return await sess.prompt("Process the audio according to the instruction.");
      }
    } catch (error) {
      console.error('Error al procesar audio:', error);
      throw error;
    }
  }

  /**
   * Verificar si el navegador soporta multimodal
   */
  async function checkSupport() {
    if (!('LanguageModel' in self)) {
      return {
        supported: false,
        image: false,
        audio: false,
        message: 'API de lenguaje no disponible'
      };
    }

    try {
      const imageAvailability = await LanguageModel.availability({
        expectedInputs: [{ type: "image" }],
        expectedOutputs: [{ type: "text" }]
      });

      const audioAvailability = await LanguageModel.availability({
        expectedInputs: [{ type: "audio" }],
        expectedOutputs: [{ type: "text" }]
      });

      return {
        supported: imageAvailability !== "unavailable" || audioAvailability !== "unavailable",
        image: imageAvailability !== "unavailable",
        audio: audioAvailability !== "unavailable",
        imageStatus: imageAvailability,
        audioStatus: audioAvailability
      };
    } catch (error) {
      return {
        supported: false,
        image: false,
        audio: false,
        message: error.message
      };
    }
  }

  /**
   * Grabar audio del micrófono
   * @param {number} maxDuration - Duración máxima en ms (default: 60000 = 1 min)
   */
  async function recordAudio(maxDuration = 60000) {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          stream.getTracks().forEach(t => t.stop());
          resolve(blob);
        };

        mediaRecorder.start(100);

        // Auto-stop después de maxDuration
        setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        }, maxDuration);

        // Retornar función para detener manualmente
        return {
          stop: () => mediaRecorder.stop(),
          mediaRecorder
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  return {
    describeImage,
    processImageWithAction,
    transcribeAudio,
    processAudioWithAction,
    checkSupport,
    recordAudio,
    initImageSession,
    initAudioSession
  };
})();

// Exponer globalmente
window.MultimodalModule = MultimodalModule;



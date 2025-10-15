const MultimodalModule = (function() {
  let session = null;
  let audioSession = null;

  /**
   * Initialize multimodal session for images
   */
  async function initImageSession() {
    if (!('LanguageModel' in self)) {
      throw new Error('This browser does not support the multimodal language API');
    }

    const availability = await LanguageModel.availability({
      expectedInputs: [{ type: "image" }],
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    });

    if (availability === "unavailable") {
      throw new Error("Multimodal model not available on this device");
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
   * Initialize multimodal session for audio
   */
  async function initAudioSession() {
    if (!('LanguageModel' in self)) {
      throw new Error('This browser does not support the multimodal language API');
    }

    const availability = await LanguageModel.availability({
      expectedInputs: [{ type: "audio" }],
      expectedOutputs: [{ type: "text", languages: ["en"] }]
    });

    if (availability === "unavailable") {
      throw new Error("Audio model not available on this device");
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
   * Describe an image
   * @param {File|Blob} imageFile - Image file
   * @param {string} prompt - Optional instruction (e.g.: "Describe the image", "Generate alt text")
   * @param {function} onProgress - Callback for streaming
   */
  async function describeImage(imageFile, prompt = "Describe the image in detail.", onProgress = null) {
    try {
      const sess = await initImageSession();

      // Attach image
      await sess.append([
        {
          role: "user",
          content: [
            { type: "image", value: imageFile }
          ]
        }
      ]);

      // Stream the result
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
      console.error('Error describing image:', error);
      throw error;
    }
  }

  /**
   * Process image with context (for actions like summarize, translate, etc.)
   * @param {File|Blob} imageFile - Image file
   * @param {string} action - Action to perform (summarize, translate, explain, answer, etc.)
   * @param {string} context - Additional context
   * @param {function} onProgress - Callback for streaming
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
   * Transcribe audio
   * @param {Blob} audioBlob - Audio in blob format
   * @param {string} mode - Mode: 'transcribe' or 'summary'
   * @param {function} onProgress - Callback for streaming
   */
  async function transcribeAudio(audioBlob, mode = 'transcribe', onProgress = null) {
    try {
      const sess = await initAudioSession();

      const instruction = mode === 'summary'
        ? "Summarize the spoken content in a clear and concise paragraph."
        : "Transcribe the audio faithfully to English, correcting filler words and unnecessary pauses.";

      // Attach audio
      await sess.append([
        {
          role: "user",
          content: [
            { type: "text", value: `Instruction: ${instruction}` },
            { type: "audio", value: audioBlob }
          ]
        }
      ]);

      const question = mode === 'summary'
        ? "Return only the summary."
        : "Return only the transcription.";

      // Stream the result
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
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  /**
   * Process audio with specific action
   * @param {Blob} audioBlob - Audio in blob format
   * @param {string} action - Action to perform
   * @param {string} context - Additional context
   * @param {function} onProgress - Callback for streaming
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
            { type: "text", value: `Instruction: ${instruction}` },
            { type: "audio", value: audioBlob }
          ]
        }
      ]);

      // Stream the result
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
      console.error('Error processing audio:', error);
      throw error;
    }
  }

  /**
   * Check if browser supports multimodal
   */
  async function checkSupport() {
    if (!('LanguageModel' in self)) {
      return {
        supported: false,
        image: false,
        audio: false,
        message: 'Language API not available'
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
   * Record audio from microphone
   * @param {number} maxDuration - Maximum duration in ms (default: 60000 = 1 min)
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

        // Auto-stop after maxDuration
        setTimeout(() => {
          if (mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
          }
        }, maxDuration);

        // Return function to stop manually
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

// Expose globally
window.MultimodalModule = MultimodalModule;



// Creado por David Montero Crespo para WriteBee

const YoutubeModule = (function() {
  let youtubePanel = null;
  let isYoutube = false;
  let currentVideoId = null;

  function init() {
    // Detect if we are on YouTube
    isYoutube = window.location.hostname.includes('youtube.com');
    
    if (isYoutube) {

      observeYoutube();
    }
  }

  function observeYoutube() {
    // Observe URL changes (YouTube is SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        onUrlChange();
      }
    }).observe(document, { subtree: true, childList: true });

    // Verify immediately
    setTimeout(onUrlChange, 1000);
  }

  function onUrlChange() {
    const videoId = getVideoId();
    
    if (videoId && videoId !== currentVideoId) {
      currentVideoId = videoId;

      insertYoutubePanel();
    } else if (!videoId && youtubePanel) {
      removeYoutubePanel();
      currentVideoId = null;
    }
  }

  function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }

  function insertYoutubePanel() {
    // Remove previous panel if it exists
    removeYoutubePanel();

    // Find the related videos container (secondary)
    const secondary = document.querySelector('#secondary');
    
    if (!secondary) {

      return;
    }

    // Create summary panel
    youtubePanel = document.createElement('div');
    youtubePanel.className = 'ai-youtube-panel';
    youtubePanel.innerHTML = `
      <div class="ai-youtube-header">
        <div class="ai-youtube-icon">
          <div class="ai-avatar" style="width: 24px; height: 24px; font-size: 12px;">
            <div class="eyes"><span></span><span></span></div>
          </div>
        </div>
        <div class="ai-youtube-title">
          <strong>AI Assistant</strong>
          <span>Summarize this video</span>
        </div>
        <button class="ai-youtube-toggle" aria-label="Expand/Collapse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>

      <div class="ai-youtube-content">
        <div class="ai-youtube-info">
          Generate an intelligent summary of this video using available subtitles.
        </div>

        <div class="ai-youtube-options">
          <label class="ai-youtube-checkbox">
            <input type="checkbox" id="ai-yt-timestamps" checked />
            <span>Include timestamps</span>
          </label>
          <label class="ai-youtube-checkbox">
            <input type="checkbox" id="ai-yt-keypoints" checked />
            <span>Key points</span>
          </label>
        </div>

        <button class="ai-youtube-summarize-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Generate Video Summary
        </button>

        <div class="ai-youtube-result" style="display: none;">
          <div class="ai-youtube-result-header">
            <span>📋 Video summary:</span>
            <div class="ai-youtube-result-actions">
              <button class="ai-youtube-copy-btn" title="Copy">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                  <rect x="5" y="5" width="10" height="10" rx="2"></rect>
                </svg>
              </button>
              <button class="ai-youtube-regenerate-btn" title="Regenerate">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="ai-youtube-result-content"></div>
        </div>
      </div>
    `;

    // Insert the panel at the beginning of secondary
    secondary.insertBefore(youtubePanel, secondary.firstChild);

    setupYoutubePanelEvents(youtubePanel);
  }

  function removeYoutubePanel() {
    if (youtubePanel) {
      youtubePanel.remove();
      youtubePanel = null;
    }
  }

  function setupYoutubePanelEvents(panel) {
    // Toggle expandir/contraer
    const toggleBtn = panel.querySelector('.ai-youtube-toggle');
    const content = panel.querySelector('.ai-youtube-content');
    let isExpanded = true;

    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      content.style.display = isExpanded ? 'block' : 'none';
      toggleBtn.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
    });

    // Generate summary button
    const summarizeBtn = panel.querySelector('.ai-youtube-summarize-btn');
    const resultDiv = panel.querySelector('.ai-youtube-result');
    const resultContent = panel.querySelector('.ai-youtube-result-content');

    summarizeBtn.addEventListener('click', async () => {
      await generateVideoSummary(summarizeBtn, resultDiv, resultContent);
    });

    // Copy button
    const copyBtn = panel.querySelector('.ai-youtube-copy-btn');
    copyBtn.addEventListener('click', () => {
      const text = resultContent.innerText;
      navigator.clipboard.writeText(text).then(() => {
        const originalHTML = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span style="font-size: 12px;">✓</span>';
        setTimeout(() => {
          copyBtn.innerHTML = originalHTML;
        }, 2000);
      });
    });

    // Regenerate button
    const regenerateBtn = panel.querySelector('.ai-youtube-regenerate-btn');
    regenerateBtn.addEventListener('click', async () => {
      await generateVideoSummary(summarizeBtn, resultDiv, resultContent);
    });
  }

  async function generateVideoSummary(btn, resultDiv, resultContent) {
    const includeTimestamps = document.getElementById('ai-yt-timestamps').checked;
    const includeKeypoints = document.getElementById('ai-yt-keypoints').checked;

    btn.disabled = true;
    btn.innerHTML = '<span style="opacity: 0.6;">Getting subtitles...</span>';
    resultDiv.style.display = 'none';

    try {
      // Get the video subtitles
      const subtitles = await getVideoSubtitles();
      
      if (!subtitles || subtitles.length === 0) {
        throw new Error('No subtitles available for this video. The video must have subtitles enabled.');
      }

      btn.innerHTML = '<span style="opacity: 0.6;">Generating summary...</span>';

      // Prepare the subtitle text
      let subtitleText = '';
      if (includeTimestamps) {
        subtitleText = subtitles.map(s => `[${formatTime(s.start)}] ${s.text}`).join('\n');
      } else {
        subtitleText = subtitles.map(s => s.text).join(' ');
      }

      // Generate the summary using AI
      const prompt = includeKeypoints 
        ? `Summarize the following YouTube video content extracting the most important key points. Organize the summary in markdown format with clear sections:\n\n${subtitleText}`
        : `Summarize the following YouTube video content clearly and concisely:\n\n${subtitleText}`;

      const summary = await AIModule.aiSummarize(prompt, (percent) => {
        btn.innerHTML = `<span style="opacity: 0.6;">Processing ${percent}%</span>`;
      });

      // Render the result
      MarkdownRenderer.renderToElement(resultContent, summary);
      resultDiv.style.display = 'block';

    } catch (error) {
      console.error('Error generating summary:', error);
      resultContent.innerHTML = `
        <div style="color: #ff6b6b; padding: 12px; background: #2a1a1a; border-radius: 6px; border-left: 3px solid #ff6b6b;">
          <strong>❌ Error:</strong> ${error.message}
        </div>
      `;
      resultDiv.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
        </svg>
        Generate Video Summary
      `;
    }
  }

  async function getVideoSubtitles() {
    try {
      const videoId = currentVideoId;
      if (!videoId) {
        throw new Error('Could not get video ID');
      }

      // Method 1: Try to access ytInitialPlayerResponse directly from window
      let playerResponse = window.ytInitialPlayerResponse;
      
      // Si no está en window, intentar buscarlo en los scripts de la página
      if (!playerResponse) {

        playerResponse = extractPlayerResponseFromScripts();
      }

      // Verificar si tenemos playerResponse válido
      if (playerResponse && playerResponse.captions && playerResponse.captions.playerCaptionsTracklistRenderer) {
        const captionTracks = playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks;

        if (captionTracks && captionTracks.length > 0) {

          // Usar la función getSubtitlesInternal con las pistas ya obtenidas
          const subtitles = await getSubtitlesInternal(videoId, captionTracks, 'es');
          
          // Mapear el formato para que sea compatible con el resto del código
          return subtitles.map(item => ({
            start: item.start,
            duration: item.dur,
            text: item.text
          }));
        }
      }

      // Método 2 (Fallback): Si ytInitialPlayerResponse no funciona, hacer fetch del HTML

      const subtitles = await getSubtitlesFromHTML(videoId, 'es');
      
      return subtitles.map(item => ({
        start: item.start,
        duration: item.dur,
        text: item.text
      }));

    } catch (error) {
      console.error('Error en getVideoSubtitles:', error);
      throw new Error('No se pudieron obtener los subtítulos. Asegúrate de que el video tenga subtítulos disponibles (manuales o automáticos). Detalle: ' + error.message);
    }
  }

  // Función para extraer playerResponse de los scripts de la página
  function extractPlayerResponseFromScripts() {
    try {
      const scripts = document.querySelectorAll('script');
      
      for (const script of scripts) {
        const content = script.textContent;
        if (content && content.includes('ytInitialPlayerResponse')) {
          const match = content.match(/var ytInitialPlayerResponse\s*=\s*({.+?});/);
          if (match && match[1]) {
            return JSON.parse(match[1]);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extrayendo playerResponse de scripts:', error);
      return null;
    }
  }

  // Función de fallback: obtener subtítulos desde HTML (método original)
  async function getSubtitlesFromHTML(videoID, lang = 'es') {
    const data = await fetchData(`https://www.youtube.com/watch?v=${videoID}`);
    
    // Asegurar que tenemos acceso a los datos de subtítulos
    if (!data.includes('captionTracks')) {
      throw new Error(`No se encontraron subtítulos para el video: ${videoID}`);
    }
    
    const regex = /"captionTracks":(\[.*?\])/;
    const match = regex.exec(data);
    
    if (!match || !match[1]) {
      throw new Error(`No se pudieron analizar los subtítulos del video: ${videoID}`);
    }

    let captionTracks;
    try {
      captionTracks = JSON.parse(match[1]);
    } catch (error) {
      console.error('Error al parsear captionTracks:', error.message);
      throw new Error(`Formato JSON inválido en captionTracks para el video: ${videoID}`);
    }

    return await getSubtitlesInternal(videoID, captionTracks, lang);
  }

  // Función auxiliar para hacer fetch de datos
  async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.text();
  }

  // Parsear subtítulos en formato JSON3 de YouTube
  function parseJson3Subtitles(json) {
    if (!json.events || !Array.isArray(json.events)) {
      throw new Error('Formato JSON3 inválido');
    }

    const subtitles = [];
    
    for (const event of json.events) {
      // Solo procesar eventos que tienen segmentos de texto
      if (!event.segs || !Array.isArray(event.segs)) {
        continue;
      }

      // Verificar si el evento es solo para append (salto de línea)
      if (event.aAppend === 1) {
        // Estos eventos son solo para formateo, los saltamos
        continue;
      }

      const startTime = event.tStartMs / 1000; // Convertir de ms a segundos
      const duration = event.dDurationMs / 1000; // Convertir de ms a segundos
      
      // Construir el texto completo del evento combinando todos los segmentos
      let fullText = '';
      
      for (const segment of event.segs) {
        if (segment.utf8 && segment.utf8 !== '\n') {
          fullText += segment.utf8;
        }
      }
      
      // Agregar el subtítulo si tiene texto válido
      const trimmedText = fullText.trim();
      if (trimmedText) {
        subtitles.push({
          start: startTime,
          dur: duration,
          text: trimmedText
        });
      }
    }

    return subtitles;
  }

  // Nueva función interna para manejar la lógica de subtítulos una vez que tenemos captionTracks
  async function getSubtitlesInternal(videoID, captionTracks, lang = 'es') {

    // Buscar subtítulos en el idioma especificado
    // Prioridad: manual (.lang) > automático (a.lang) > cualquiera que coincida con el idioma
    let finalSubtitle =
      captionTracks.find((track) => track.vssId === `.${lang}`) || // Manual
      captionTracks.find((track) => track.vssId === `a.${lang}`) || // Automático
      captionTracks.find((track) => track.languageCode === lang) || // Código de idioma directo
      captionTracks.find((track) => track.languageCode && track.languageCode.startsWith(lang)); // Comienza con el código de idioma

    // Si no encuentra en el idioma especificado, intentar con inglés
    let usedLang = lang;
    if (!finalSubtitle && lang !== 'en') {

      usedLang = 'en';
      finalSubtitle =
        captionTracks.find((track) => track.vssId === `.en`) ||
        captionTracks.find((track) => track.vssId === `a.en`) ||
        captionTracks.find((track) => track.languageCode === 'en') ||
        captionTracks.find((track) => track.languageCode && track.languageCode.startsWith('en'));
    }

    // Si aún no encuentra, usar el primer subtítulo disponible
    if (!finalSubtitle && captionTracks.length > 0) {

      finalSubtitle = captionTracks[0];
      usedLang = finalSubtitle.languageCode || 'unknown';
    }

    if (!finalSubtitle || !finalSubtitle.baseUrl) {
      throw new Error(`No se encontraron subtítulos disponibles para el video.`);
    }

    let transcript;
    try {
      // Siempre añadir &fmt=json3 para preferir el formato JSON
      const jsonUrl = finalSubtitle.baseUrl + '&fmt=json3';

      const jsonData = await fetchData(jsonUrl);
      const json = JSON.parse(jsonData);
      
      transcript = parseJson3Subtitles(json);

    } catch (jsonError) {

      // Fallback a XML si JSON3 falla
      try {
        const transcriptData = await fetchData(finalSubtitle.baseUrl);

        // Parsear el XML usando DOMParser (más robusto que regex)
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(transcriptData, 'text/xml');
        
        // Verificar si hay errores de parseo
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
          throw new Error('Error al parsear XML: ' + parseError.textContent);
        }
        
        const textNodes = xmlDoc.querySelectorAll('text');

        if (textNodes.length === 0) {
          throw new Error('No se encontraron nodos <text> en el XML');
        }
        
        transcript = Array.from(textNodes).map(node => {
          const start = parseFloat(node.getAttribute('start') || '0');
          const dur = parseFloat(node.getAttribute('dur') || '0');
          const text = node.textContent
            .replace(/&amp;/gi, '&')
            .replace(/&lt;/gi, '<')
            .replace(/&gt;/gi, '>')
            .replace(/&quot;/gi, '"')
            .replace(/&#39;/gi, "'")
            .trim();
          
          return {
            start: start,
            dur: dur,
            text: text,
          };
        }).filter(item => item.text && item.text.length > 0);

        if (transcript.length === 0) {
          throw new Error('El XML no contiene subtítulos válidos');
        }
        
      } catch (xmlError) {
        console.error('❌ Error procesando XML:', xmlError);
        throw new Error('No se pudieron parsear los subtítulos en ningún formato. ' + xmlError.message);
      }
    }

    return transcript;
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // API pública
  const publicAPI = {
    init,
    summarizeVideo: async function() {
      const panel = youtubePanel || document.querySelector('.ai-youtube-panel');
      if (panel) {
        const summarizeBtn = panel.querySelector('.ai-youtube-summarize-btn');
        const resultDiv = panel.querySelector('.ai-youtube-result');
        const resultContent = panel.querySelector('.ai-youtube-result-content');
        await generateVideoSummary(summarizeBtn, resultDiv, resultContent);
      } else {
        alert('Por favor, abre un video de YouTube primero');
      }
    }
  };

  // Hacer disponible globalmente
  window.YoutubeModule = publicAPI;

  return publicAPI;
})();



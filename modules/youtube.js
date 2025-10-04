const YoutubeModule = (function() {
  let youtubePanel = null;
  let isYoutube = false;
  let currentVideoId = null;

  function init() {
    // Detectar si estamos en YouTube
    isYoutube = window.location.hostname.includes('youtube.com');
    
    if (isYoutube) {
      console.log('📺 YouTube detectado, iniciando módulo...');
      observeYoutube();
    }
  }

  function observeYoutube() {
    // Observar cambios en la URL (YouTube es SPA)
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        onUrlChange();
      }
    }).observe(document, { subtree: true, childList: true });

    // Verificar inmediatamente
    setTimeout(onUrlChange, 1000);
  }

  function onUrlChange() {
    const videoId = getVideoId();
    
    if (videoId && videoId !== currentVideoId) {
      currentVideoId = videoId;
      console.log('📹 Nuevo video detectado:', videoId);
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
    // Remover panel anterior si existe
    removeYoutubePanel();

    // Buscar el contenedor de videos relacionados (secondary)
    const secondary = document.querySelector('#secondary');
    
    if (!secondary) {
      console.log('⚠️ No se encontró el contenedor #secondary');
      return;
    }

    // Crear panel de resumen
    youtubePanel = document.createElement('div');
    youtubePanel.className = 'ai-youtube-panel';
    youtubePanel.innerHTML = `
      <div class="ai-youtube-header">
        <div class="ai-youtube-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M8 10h8M8 14h4"/>
          </svg>
        </div>
        <div class="ai-youtube-title">
          <strong>Asistente AI</strong>
          <span>Resume este video</span>
        </div>
        <button class="ai-youtube-toggle" aria-label="Expandir/Contraer">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
      </div>

      <div class="ai-youtube-content">
        <div class="ai-youtube-info">
          💡 Genera un resumen inteligente de este video usando los subtítulos disponibles.
        </div>

        <div class="ai-youtube-options">
          <label class="ai-youtube-checkbox">
            <input type="checkbox" id="ai-yt-timestamps" checked />
            <span>Incluir marcas de tiempo</span>
          </label>
          <label class="ai-youtube-checkbox">
            <input type="checkbox" id="ai-yt-keypoints" checked />
            <span>Puntos clave</span>
          </label>
        </div>

        <button class="ai-youtube-summarize-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Generar Resumen del Video
        </button>

        <div class="ai-youtube-result" style="display: none;">
          <div class="ai-youtube-result-header">
            <span>📋 Resumen del video:</span>
            <div class="ai-youtube-result-actions">
              <button class="ai-youtube-copy-btn" title="Copiar">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                  <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                  <rect x="5" y="5" width="10" height="10" rx="2"></rect>
                </svg>
              </button>
              <button class="ai-youtube-regenerate-btn" title="Regenerar">
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

    // Insertar el panel al inicio del secondary
    secondary.insertBefore(youtubePanel, secondary.firstChild);
    console.log('✅ Panel de YouTube insertado');

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

    // Botón generar resumen
    const summarizeBtn = panel.querySelector('.ai-youtube-summarize-btn');
    const resultDiv = panel.querySelector('.ai-youtube-result');
    const resultContent = panel.querySelector('.ai-youtube-result-content');

    summarizeBtn.addEventListener('click', async () => {
      await generateVideoSummary(summarizeBtn, resultDiv, resultContent);
    });

    // Botón copiar
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

    // Botón regenerar
    const regenerateBtn = panel.querySelector('.ai-youtube-regenerate-btn');
    regenerateBtn.addEventListener('click', async () => {
      await generateVideoSummary(summarizeBtn, resultDiv, resultContent);
    });
  }

  async function generateVideoSummary(btn, resultDiv, resultContent) {
    const includeTimestamps = document.getElementById('ai-yt-timestamps').checked;
    const includeKeypoints = document.getElementById('ai-yt-keypoints').checked;

    btn.disabled = true;
    btn.innerHTML = '<span style="opacity: 0.6;">Obteniendo subtítulos...</span>';
    resultDiv.style.display = 'none';

    try {
      // Obtener los subtítulos del video
      const subtitles = await getVideoSubtitles();
      
      if (!subtitles || subtitles.length === 0) {
        throw new Error('No se encontraron subtítulos disponibles para este video. El video debe tener subtítulos activados.');
      }

      btn.innerHTML = '<span style="opacity: 0.6;">Generando resumen...</span>';

      // Preparar el texto de los subtítulos
      let subtitleText = '';
      if (includeTimestamps) {
        subtitleText = subtitles.map(s => `[${formatTime(s.start)}] ${s.text}`).join('\n');
      } else {
        subtitleText = subtitles.map(s => s.text).join(' ');
      }

      // Generar el resumen usando AI
      const prompt = includeKeypoints 
        ? `Resume el siguiente contenido de video de YouTube extrayendo los puntos clave más importantes. Organiza el resumen en formato markdown con secciones claras:\n\n${subtitleText}`
        : `Resume el siguiente contenido de video de YouTube de manera clara y concisa:\n\n${subtitleText}`;

      const summary = await AIModule.aiSummarize(prompt, (percent) => {
        btn.innerHTML = `<span style="opacity: 0.6;">Procesando ${percent}%</span>`;
      });

      // Renderizar el resultado
      MarkdownRenderer.renderToElement(resultContent, summary);
      resultDiv.style.display = 'block';

    } catch (error) {
      console.error('Error al generar resumen:', error);
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
        Generar Resumen del Video
      `;
    }
  }

  async function getVideoSubtitles() {
    try {
      const videoId = currentVideoId;
      if (!videoId) {
        throw new Error('No se pudo obtener el ID del video');
      }

      console.log('� Obteniendo subtítulos para video:', videoId);

      // Intentar obtener subtítulos usando los métodos mejorados
      const subtitles = await fetchYoutubeSubtitles(videoId);
      return subtitles;

    } catch (error) {
      console.error('Error obteniendo subtítulos:', error);
      throw error;
    }
  }

  async function fetchYoutubeSubtitles(videoId) {
    try {
      // Método 1: Usar ytInitialPlayerResponse del DOM
      const ytInitialPlayerResponse = await extractPlayerResponse();
      
      if (ytInitialPlayerResponse) {
        const subtitles = await parseSubtitlesFromPlayerResponse(ytInitialPlayerResponse);
        if (subtitles && subtitles.length > 0) {
          return subtitles;
        }
      }

      // Método 2: Fetch HTML y parsear
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
      const html = await response.text();

      // Buscar ytInitialPlayerResponse en el HTML
      const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.+?});/);
      
      if (playerResponseMatch) {
        const playerData = JSON.parse(playerResponseMatch[1]);
        const subtitles = await parseSubtitlesFromPlayerResponse(playerData);
        if (subtitles && subtitles.length > 0) {
          return subtitles;
        }
      }

      // Método 3: Buscar captionTracks directamente (método antiguo)
      const captionsRegex = /"captionTracks":(\[.*?\])/;
      const match = html.match(captionsRegex);

      if (!match) {
        throw new Error('No se encontraron subtítulos disponibles');
      }

      const captionTracks = JSON.parse(match[1]);
      
      if (captionTracks.length === 0) {
        throw new Error('No hay pistas de subtítulos disponibles');
      }

      // Preferir subtítulos manuales primero, luego automáticos
      let captionUrl = findBestCaptionTrack(captionTracks);

      if (!captionUrl) {
        throw new Error('No se pudo obtener la URL de subtítulos');
      }

      // Obtener los subtítulos
      const captionsResponse = await fetch(captionUrl);
      const captionsXml = await captionsResponse.text();

      // Parsear el XML de subtítulos
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(captionsXml, 'text/xml');
      const textNodes = xmlDoc.querySelectorAll('text');

      const subtitles = Array.from(textNodes).map(node => ({
        start: parseFloat(node.getAttribute('start')),
        duration: parseFloat(node.getAttribute('dur')),
        text: decodeHTMLEntities(node.textContent)
      }));

      console.log(`✅ Subtítulos obtenidos: ${subtitles.length} segmentos`);
      return subtitles;

    } catch (error) {
      console.error('Error en fetchYoutubeSubtitles:', error);
      throw new Error('No se pudieron obtener los subtítulos. Asegúrate de que el video tenga subtítulos disponibles (manuales o automáticos).');
    }
  }

  async function extractPlayerResponse() {
    try {
      // Buscar ytInitialPlayerResponse en el DOM
      const scripts = document.querySelectorAll('script');
      
      for (const script of scripts) {
        const content = script.textContent;
        if (content.includes('ytInitialPlayerResponse')) {
          const match = content.match(/var ytInitialPlayerResponse = ({.+?});/);
          if (match) {
            return JSON.parse(match[1]);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extrayendo player response:', error);
      return null;
    }
  }

  async function parseSubtitlesFromPlayerResponse(playerData) {
    try {
      const captions = playerData?.captions?.playerCaptionsTracklistRenderer;
      
      if (!captions || !captions.captionTracks) {
        console.log('No se encontraron captionTracks en playerData');
        return null;
      }

      const captionTracks = captions.captionTracks;
      const captionUrl = findBestCaptionTrack(captionTracks);

      if (!captionUrl) {
        return null;
      }

      // Obtener los subtítulos
      const captionsResponse = await fetch(captionUrl);
      const captionsXml = await captionsResponse.text();

      // Parsear el XML de subtítulos
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(captionsXml, 'text/xml');
      const textNodes = xmlDoc.querySelectorAll('text');

      const subtitles = Array.from(textNodes).map(node => ({
        start: parseFloat(node.getAttribute('start')),
        duration: parseFloat(node.getAttribute('dur')),
        text: decodeHTMLEntities(node.textContent)
      }));

      console.log(`✅ Subtítulos obtenidos desde playerResponse: ${subtitles.length} segmentos`);
      return subtitles;

    } catch (error) {
      console.error('Error parseando subtítulos de playerData:', error);
      return null;
    }
  }

  function findBestCaptionTrack(captionTracks) {
    // Prioridad de selección:
    // 1. Subtítulos manuales en español
    // 2. Subtítulos manuales en inglés
    // 3. Subtítulos automáticos en español (asr)
    // 4. Subtítulos automáticos en inglés (asr)
    // 5. Cualquier subtítulo manual disponible
    // 6. Cualquier subtítulo automático disponible

    // Separar manuales y automáticos
    const manualTracks = captionTracks.filter(t => !t.kind || t.kind !== 'asr');
    const autoTracks = captionTracks.filter(t => t.kind === 'asr');

    // Buscar en subtítulos manuales primero
    let track = manualTracks.find(t => t.languageCode === 'es' || t.languageCode === 'es-419');
    if (track) {
      console.log('✅ Usando subtítulos manuales en español');
      return track.baseUrl;
    }

    track = manualTracks.find(t => t.languageCode === 'en' || t.languageCode.startsWith('en'));
    if (track) {
      console.log('✅ Usando subtítulos manuales en inglés');
      return track.baseUrl;
    }

    // Si no hay manuales, buscar en automáticos
    track = autoTracks.find(t => t.languageCode === 'es' || t.languageCode === 'es-419');
    if (track) {
      console.log('✅ Usando subtítulos automáticos en español');
      return track.baseUrl;
    }

    track = autoTracks.find(t => t.languageCode === 'en' || t.languageCode.startsWith('en'));
    if (track) {
      console.log('✅ Usando subtítulos automáticos en inglés');
      return track.baseUrl;
    }

    // Si no hay en español o inglés, usar el primero manual disponible
    if (manualTracks.length > 0) {
      console.log(`✅ Usando subtítulos manuales en ${manualTracks[0].languageCode}`);
      return manualTracks[0].baseUrl;
    }

    // Como último recurso, usar el primero automático disponible
    if (autoTracks.length > 0) {
      console.log(`✅ Usando subtítulos automáticos en ${autoTracks[0].languageCode}`);
      return autoTracks[0].baseUrl;
    }

    return null;
  }

  function decodeHTMLEntities(text) {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
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

  return {
    init
  };
})();

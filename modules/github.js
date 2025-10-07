const GithubModule = (function() {
  let githubPanel = null;
  let isGithub = false;
  let currentRepo = null;

  function init() {
    // Detectar si estamos en GitHub
    isGithub = window.location.hostname.includes('github.com');
    
    if (isGithub) {
      console.log('🐙 GitHub detectado, iniciando módulo...');
      observeGithub();
    }
  }

  function observeGithub() {
    // Observar cambios en la URL (GitHub es SPA)
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
    const repoInfo = getRepoInfo();
    
    if (repoInfo && repoInfo !== currentRepo) {
      currentRepo = repoInfo;
      console.log('📦 Nuevo repositorio detectado:', repoInfo);
      insertGithubPanel();
    } else if (!repoInfo && githubPanel) {
      removeGithubPanel();
      currentRepo = null;
    }
  }

  function getRepoInfo() {
    // Detectar si estamos en la página de un repositorio
    // URL pattern: github.com/:owner/:repo
    const pathParts = window.location.pathname.split('/').filter(p => p);
    
    if (pathParts.length >= 2) {
      const owner = pathParts[0];
      const repo = pathParts[1];
      
      // Asegurarse de que no estamos en páginas especiales como settings, issues, etc
      if (!['settings', 'marketplace', 'pricing', 'features', 'explore'].includes(owner)) {
        return { owner, repo, fullName: `${owner}/${repo}` };
      }
    }
    
    return null;
  }

  function insertGithubPanel() {
    // Remover panel anterior si existe
    removeGithubPanel();

    // Buscar el contenedor "About" en el sidebar derecho
    const aboutContainer = document.querySelector('.BorderGrid.about-margin[data-pjax]');
    
    if (!aboutContainer) {
      console.log('⚠️ No se encontró el contenedor .BorderGrid.about-margin');
      return;
    }

    // Crear panel de resumen
    githubPanel = document.createElement('div');
    githubPanel.className = 'BorderGrid-row';
    githubPanel.innerHTML = `
      <div class="BorderGrid-cell">
        <div class="ai-github-panel">
          <div class="ai-github-header">
            <div class="ai-github-icon">
              <div class="ai-avatar" style="width: 24px; height: 24px; font-size: 12px;">
                <div class="eyes"><span></span><span></span></div>
              </div>
            </div>
            <div class="ai-github-title">
              <strong>AI Repository Summary</strong>
              <span>Resumen inteligente del repositorio</span>
            </div>
            <button class="ai-github-toggle" aria-label="Expandir/Contraer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>

          <div class="ai-github-content">
            <div class="ai-github-info">
              Genera un resumen inteligente analizando el README, package.json, y estructura del repositorio.
            </div>

            <div class="ai-github-options">
              <label class="ai-github-checkbox">
                <input type="checkbox" id="ai-gh-techs" checked />
                <span>Tecnologías utilizadas</span>
              </label>
              <label class="ai-github-checkbox">
                <input type="checkbox" id="ai-gh-structure" checked />
                <span>Estructura del proyecto</span>
              </label>
              <label class="ai-github-checkbox">
                <input type="checkbox" id="ai-gh-purpose" checked />
                <span>Propósito y características</span>
              </label>
            </div>

            <button class="ai-github-summarize-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Generar Resumen del Repositorio
            </button>

            <div class="ai-github-result" style="display: none;">
              <div class="ai-github-result-header">
                <span>📋 Resumen del repositorio:</span>
                <div class="ai-github-result-actions">
                  <button class="ai-github-copy-btn" title="Copiar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                      <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                      <rect x="5" y="5" width="10" height="10" rx="2"></rect>
                    </svg>
                  </button>
                  <button class="ai-github-regenerate-btn" title="Regenerar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div class="ai-github-result-content"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insertar el panel al inicio del contenedor About
    aboutContainer.insertBefore(githubPanel, aboutContainer.firstChild);
    console.log('✅ Panel de GitHub insertado');

    setupGithubPanelEvents(githubPanel);
  }

  function removeGithubPanel() {
    if (githubPanel) {
      githubPanel.remove();
      githubPanel = null;
    }
  }

  function setupGithubPanelEvents(panel) {
    // Toggle expandir/contraer
    const toggleBtn = panel.querySelector('.ai-github-toggle');
    const content = panel.querySelector('.ai-github-content');
    let isExpanded = true;

    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      content.style.display = isExpanded ? 'block' : 'none';
      toggleBtn.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
    });

    // Botón generar resumen
    const summarizeBtn = panel.querySelector('.ai-github-summarize-btn');
    const resultDiv = panel.querySelector('.ai-github-result');
    const resultContent = panel.querySelector('.ai-github-result-content');

    summarizeBtn.addEventListener('click', async () => {
      await generateRepoSummary(summarizeBtn, resultDiv, resultContent);
    });

    // Botón copiar
    const copyBtn = panel.querySelector('.ai-github-copy-btn');
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
    const regenerateBtn = panel.querySelector('.ai-github-regenerate-btn');
    regenerateBtn.addEventListener('click', async () => {
      await generateRepoSummary(summarizeBtn, resultDiv, resultContent);
    });
  }

  async function generateRepoSummary(btn, resultDiv, resultContent) {
    const includeTechs = document.getElementById('ai-gh-techs').checked;
    const includeStructure = document.getElementById('ai-gh-structure').checked;
    const includePurpose = document.getElementById('ai-gh-purpose').checked;

    btn.disabled = true;
    btn.innerHTML = '<span style="opacity: 0.6;">Analizando repositorio...</span>';
    resultDiv.style.display = 'none';

    try {
      // Recopilar información del repositorio
      const repoData = await collectRepoData();
      
      if (!repoData) {
        throw new Error('No se pudo obtener información del repositorio.');
      }

      btn.innerHTML = '<span style="opacity: 0.6;">Generando resumen...</span>';

      // Construir el prompt para la AI
      let prompt = `Analiza el siguiente repositorio de GitHub y genera un resumen completo:\n\n`;
      prompt += `**Repositorio:** ${currentRepo.fullName}\n`;
      prompt += `**URL:** ${window.location.href}\n\n`;

      if (repoData.readme) {
        prompt += `**README.md:**\n${repoData.readme}\n\n`;
      }

      if (repoData.packageJson) {
        prompt += `**package.json:**\n\`\`\`json\n${JSON.stringify(repoData.packageJson, null, 2)}\n\`\`\`\n\n`;
      }

      if (repoData.description) {
        prompt += `**Descripción:** ${repoData.description}\n\n`;
      }

      if (repoData.topics && repoData.topics.length > 0) {
        prompt += `**Topics:** ${repoData.topics.join(', ')}\n\n`;
      }

      if (repoData.languages && repoData.languages.length > 0) {
        prompt += `**Lenguajes:** ${repoData.languages.join(', ')}\n\n`;
      }

      if (repoData.fileStructure) {
        prompt += `**Estructura de archivos:**\n${repoData.fileStructure}\n\n`;
      }

      // Añadir instrucciones según opciones seleccionadas
      prompt += `Genera un resumen en formato Markdown que incluya:\n`;
      if (includePurpose) {
        prompt += `- 🎯 **Propósito**: Qué hace este repositorio y para qué sirve\n`;
      }
      if (includeTechs) {
        prompt += `- 🛠️ **Tecnologías**: Stack tecnológico utilizado\n`;
      }
      if (includeStructure) {
        prompt += `- 📁 **Estructura**: Organización del proyecto\n`;
      }
      prompt += `- ✨ **Características principales**: Features destacadas\n`;
      prompt += `- 🚀 **Uso**: Cómo empezar con el proyecto (si está disponible)\n\n`;
      prompt += `El resumen debe ser claro, conciso y profesional. Usa emojis apropiados para hacer el contenido más visual.`;

      const summary = await AIModule.aiAnswer(prompt, (percent) => {
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
        Generar Resumen del Repositorio
      `;
    }
  }

  async function collectRepoData() {
    const data = {};

    try {
      // 1. Obtener descripción visible en la página
      const descriptionEl = document.querySelector('p.f4.my-3');
      if (descriptionEl) {
        data.description = descriptionEl.textContent.trim();
      }

      // 2. Obtener topics
      const topicsEls = document.querySelectorAll('.topic-tag');
      if (topicsEls.length > 0) {
        data.topics = Array.from(topicsEls).map(el => el.textContent.trim());
      }

      // 3. Obtener lenguajes
      const languagesEls = document.querySelectorAll('[data-ga-click*="language"]');
      if (languagesEls.length > 0) {
        data.languages = Array.from(languagesEls)
          .map(el => el.textContent.trim())
          .filter(lang => lang);
      }

      // 4. Intentar obtener README desde la página
      const readmeContent = extractReadmeFromPage();
      if (readmeContent) {
        data.readme = readmeContent;
      } else {
        // Si no está visible, intentar fetch
        data.readme = await fetchReadme();
      }

      // 5. Intentar obtener package.json (para proyectos Node.js)
      data.packageJson = await fetchPackageJson();

      // 6. Obtener estructura de archivos visible
      data.fileStructure = extractFileStructure();

      console.log('📊 Datos del repositorio recopilados:', data);
      return data;

    } catch (error) {
      console.error('Error recopilando datos del repo:', error);
      return data; // Devolver lo que se haya podido recopilar
    }
  }

  function extractReadmeFromPage() {
    // Buscar el contenedor del README en la página
    const readmeContainer = document.querySelector('article.markdown-body');
    
    if (readmeContainer) {
      // Extraer texto limpio del README
      const text = readmeContainer.innerText;
      // Limitar a los primeros 3000 caracteres para no saturar el contexto
      return text.length > 3000 ? text.substring(0, 3000) + '...' : text;
    }
    
    return null;
  }

  async function fetchReadme() {
    try {
      // Intentar obtener el README via API raw de GitHub
      const readmeUrl = `https://raw.githubusercontent.com/${currentRepo.owner}/${currentRepo.repo}/main/README.md`;
      
      const response = await fetch(readmeUrl);
      
      if (!response.ok) {
        // Intentar con master en lugar de main
        const masterUrl = `https://raw.githubusercontent.com/${currentRepo.owner}/${currentRepo.repo}/master/README.md`;
        const masterResponse = await fetch(masterUrl);
        
        if (!masterResponse.ok) {
          console.log('No se encontró README.md');
          return null;
        }
        
        const text = await masterResponse.text();
        return text.length > 3000 ? text.substring(0, 3000) + '...' : text;
      }
      
      const text = await response.text();
      return text.length > 3000 ? text.substring(0, 3000) + '...' : text;
      
    } catch (error) {
      console.error('Error obteniendo README:', error);
      return null;
    }
  }

  async function fetchPackageJson() {
    try {
      // Intentar obtener package.json via API raw de GitHub
      const packageUrl = `https://raw.githubusercontent.com/${currentRepo.owner}/${currentRepo.repo}/main/package.json`;
      
      const response = await fetch(packageUrl);
      
      if (!response.ok) {
        // Intentar con master
        const masterUrl = `https://raw.githubusercontent.com/${currentRepo.owner}/${currentRepo.repo}/master/package.json`;
        const masterResponse = await fetch(masterUrl);
        
        if (!masterResponse.ok) {
          return null;
        }
        
        return await masterResponse.json();
      }
      
      return await response.json();
      
    } catch (error) {
      console.log('No se encontró package.json (puede no ser un proyecto Node.js)');
      return null;
    }
  }

  function extractFileStructure() {
    // Extraer estructura de archivos visible en la página
    const fileRows = document.querySelectorAll('.react-directory-row, [role="row"]');
    
    if (fileRows.length > 0) {
      const files = Array.from(fileRows)
        .slice(0, 20) // Limitar a 20 archivos
        .map(row => {
          const nameEl = row.querySelector('[role="rowheader"] a, .Link--primary');
          if (nameEl) {
            return nameEl.textContent.trim();
          }
          return null;
        })
        .filter(f => f);
      
      if (files.length > 0) {
        return files.join('\n');
      }
    }
    
    return null;
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

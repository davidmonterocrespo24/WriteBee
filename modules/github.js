const GithubModule = (function() {
  let githubPanel = null;
  let isGithub = false;
  let currentRepo = null;

  function init() {
    // Detect if we are on GitHub
    isGithub = window.location.hostname.includes('github.com');
    
    if (isGithub) {
      console.log('🐙 GitHub detected, starting module...');
      observeGithub();
    }
  }

  function observeGithub() {
    // Observe URL changes (GitHub is SPA)
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
    const repoInfo = getRepoInfo();
    
    if (repoInfo && repoInfo !== currentRepo) {
      currentRepo = repoInfo;
      console.log('📦 New repository detected:', repoInfo);
      insertGithubPanel();
    } else if (!repoInfo && githubPanel) {
      removeGithubPanel();
      currentRepo = null;
    }
  }

  function getRepoInfo() {
    // Detect if we are on a repository page
    // URL pattern: github.com/:owner/:repo
    const pathParts = window.location.pathname.split('/').filter(p => p);
    
    if (pathParts.length >= 2) {
      const owner = pathParts[0];
      const repo = pathParts[1];
      
      // Make sure we are not on special pages like settings, issues, etc
      if (!['settings', 'marketplace', 'pricing', 'features', 'explore'].includes(owner)) {
        return { owner, repo, fullName: `${owner}/${repo}` };
      }
    }
    
    return null;
  }

  function insertGithubPanel() {
    // Remove previous panel if it exists
    removeGithubPanel();

    // Find the "About" container in the right sidebar
    const aboutContainer = document.querySelector('.BorderGrid.about-margin[data-pjax]');
    
    if (!aboutContainer) {
      console.log('⚠️ .BorderGrid.about-margin container not found');
      return;
    }

    // Create summary panel
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
              <span>Smart repository summary</span>
            </div>
            <button class="ai-github-toggle" aria-label="Expand/Collapse">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
          </div>

          <div class="ai-github-content">
            <div class="ai-github-options">
              <label class="ai-github-checkbox">
                <input type="checkbox" id="ai-gh-techs" checked />
                <span>Technologies used</span>
              </label>
              <label class="ai-github-checkbox">
                <input type="checkbox" id="ai-gh-structure" checked />
                <span>Project structure</span>
              </label>
              <label class="ai-github-checkbox">
                <input type="checkbox" id="ai-gh-purpose" checked />
                <span>Purpose and features</span>
              </label>
            </div>

            <button class="ai-github-summarize-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
              </svg>
              Generate Repository Summary
            </button>

            <div class="ai-github-result" style="display: none;">
              <div class="ai-github-result-header">
                <span>📋 Repository summary:</span>
                <div class="ai-github-result-actions">
                  <button class="ai-github-copy-btn" title="Copy">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
                      <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                      <rect x="5" y="5" width="10" height="10" rx="2"></rect>
                    </svg>
                  </button>
                  <button class="ai-github-regenerate-btn" title="Regenerate">
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

    // Insert the panel at the beginning of the About container
    aboutContainer.insertBefore(githubPanel, aboutContainer.firstChild);
    console.log('✅ GitHub panel inserted');

    setupGithubPanelEvents(githubPanel);
  }

  function removeGithubPanel() {
    if (githubPanel) {
      githubPanel.remove();
      githubPanel = null;
    }
  }

  function setupGithubPanelEvents(panel) {
    // Toggle expand/collapse
    const toggleBtn = panel.querySelector('.ai-github-toggle');
    const content = panel.querySelector('.ai-github-content');
    let isExpanded = true;

    toggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      content.style.display = isExpanded ? 'block' : 'none';
      toggleBtn.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)';
    });

    // Generate summary button
    const summarizeBtn = panel.querySelector('.ai-github-summarize-btn');
    const resultDiv = panel.querySelector('.ai-github-result');
    const resultContent = panel.querySelector('.ai-github-result-content');

    summarizeBtn.addEventListener('click', async () => {
      await generateRepoSummary(summarizeBtn, resultDiv, resultContent);
    });

    // Copy button
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

    // Regenerate button
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
    btn.innerHTML = `
      <svg class="ai-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"></path>
      </svg>
      <span style="opacity: 0.6;">Analyzing repository...</span>
    `;
    resultDiv.style.display = 'none';

    try {
      // Collect repository information
      const repoData = await collectRepoData();
      
      if (!repoData) {
        throw new Error('Could not obtain repository information.');
      }

      btn.innerHTML = `
        <svg class="ai-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 18px; height: 18px; animation: spin 1s linear infinite;">
          <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
          <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"></path>
        </svg>
        <span style="opacity: 0.6;">Generating summary...</span>
      `;

      // Build the prompt for the AI
      let prompt = `Analyze the following GitHub repository and generate a complete summary:\n\n`;
      prompt += `**Repository:** ${currentRepo.fullName}\n`;
      prompt += `**URL:** ${window.location.href}\n\n`;

      if (repoData.readme) {
        prompt += `**README.md:**\n${repoData.readme}\n\n`;
      }

      if (repoData.packageJson) {
        prompt += `**package.json:**\n\`\`\`json\n${JSON.stringify(repoData.packageJson, null, 2)}\n\`\`\`\n\n`;
      }

      if (repoData.description) {
        prompt += `**Description:** ${repoData.description}\n\n`;
      }

      if (repoData.topics && repoData.topics.length > 0) {
        prompt += `**Topics:** ${repoData.topics.join(', ')}\n\n`;
      }

      if (repoData.languages && repoData.languages.length > 0) {
        prompt += `**Languages:** ${repoData.languages.join(', ')}\n\n`;
      }

      if (repoData.fileStructure) {
        prompt += `**File structure:**\n${repoData.fileStructure}\n\n`;
      }

      // Add instructions according to selected options
      prompt += `Generate a summary in Markdown format that includes:\n`;
      if (includePurpose) {
        prompt += `- 🎯 **Purpose**: What this repository does and what it is for\n`;
      }
      if (includeTechs) {
        prompt += `- 🛠️ **Technologies**: Technology stack used\n`;
      }
      if (includeStructure) {
        prompt += `- 📁 **Structure**: Project organization\n`;
      }
      prompt += `- ✨ **Main features**: Outstanding features\n`;
      prompt += `- 🚀 **Usage**: How to get started with the project (if available)\n\n`;
      prompt += `The summary should be clear, concise and professional. Use appropriate emojis to make the content more visual.`;

      const summary = await AIModule.aiAnswer(prompt);

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
        Generate Repository Summary
      `;
    }
  }

  async function collectRepoData() {
    const data = {};

    try {
      // 1. Get visible description from the page
      const descriptionEl = document.querySelector('p.f4.my-3');
      if (descriptionEl) {
        data.description = descriptionEl.textContent.trim();
      }

      // 2. Get topics
      const topicsEls = document.querySelectorAll('.topic-tag');
      if (topicsEls.length > 0) {
        data.topics = Array.from(topicsEls).map(el => el.textContent.trim());
      }

      // 3. Get languages
      const languagesEls = document.querySelectorAll('[data-ga-click*="language"]');
      if (languagesEls.length > 0) {
        data.languages = Array.from(languagesEls)
          .map(el => el.textContent.trim())
          .filter(lang => lang);
      }

      // 4. Try to get README from the page
      const readmeContent = extractReadmeFromPage();
      if (readmeContent) {
        data.readme = readmeContent;
      } else {
        // If not visible, try fetch
        data.readme = await fetchReadme();
      }

      // 5. Try to get package.json (for Node.js projects)
      data.packageJson = await fetchPackageJson();

      // 6. Get visible file structure
      data.fileStructure = extractFileStructure();

      console.log('📊 Repository data collected:', data);
      return data;

    } catch (error) {
      console.error('Error collecting repo data:', error);
      return data; // Return what could be collected
    }
  }

  function extractReadmeFromPage() {
    // Find the README container on the page
    const readmeContainer = document.querySelector('article.markdown-body');
    
    if (readmeContainer) {
      // Extract clean text from README
      const text = readmeContainer.innerText;
      // Limit to the first 3000 characters to not saturate the context
      return text.length > 3000 ? text.substring(0, 3000) + '...' : text;
    }
    
    return null;
  }

  async function fetchReadme() {
    try {
      // Try to get the README via GitHub raw API
      const readmeUrl = `https://raw.githubusercontent.com/${currentRepo.owner}/${currentRepo.repo}/main/README.md`;
      
      const response = await fetch(readmeUrl);
      
      if (!response.ok) {
        // Try with master instead of main
        const masterUrl = `https://raw.githubusercontent.com/${currentRepo.owner}/${currentRepo.repo}/master/README.md`;
        const masterResponse = await fetch(masterUrl);
        
        if (!masterResponse.ok) {
          console.log('README.md not found');
          return null;
        }
        
        const text = await masterResponse.text();
        return text.length > 3000 ? text.substring(0, 3000) + '...' : text;
      }
      
      const text = await response.text();
      return text.length > 3000 ? text.substring(0, 3000) + '...' : text;
      
    } catch (error) {
      console.error('Error obtaining README:', error);
      return null;
    }
  }

  async function fetchPackageJson() {
    try {
      // Try to get package.json via GitHub raw API
      const packageUrl = `https://raw.githubusercontent.com/${currentRepo.owner}/${currentRepo.repo}/main/package.json`;
      
      const response = await fetch(packageUrl);
      
      if (!response.ok) {
        // Try with master
        const masterUrl = `https://raw.githubusercontent.com/${currentRepo.owner}/${currentRepo.repo}/master/package.json`;
        const masterResponse = await fetch(masterUrl);
        
        if (!masterResponse.ok) {
          return null;
        }
        
        return await masterResponse.json();
      }
      
      return await response.json();
      
    } catch (error) {
      console.log('package.json not found (may not be a Node.js project)');
      return null;
    }
  }

  function extractFileStructure() {
    // Extract visible file structure from the page
    const fileRows = document.querySelectorAll('.react-directory-row, [role="row"]');
    
    if (fileRows.length > 0) {
      const files = Array.from(fileRows)
        .slice(0, 20) // Limit to 20 files
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

  async function summarizeRepo() {
    console.log('🐙 Generating repository summary from floating button...');
    
    // Verify we are in a repository
    if (!currentRepo) {
      alert('GitHub repository not detected. Make sure you are on a repository page.');
      return;
    }

    // If the panel already exists, scroll to it and execute the summary
    if (githubPanel) {
      githubPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Expand the content if collapsed
      const content = githubPanel.querySelector('.ai-github-content');
      const toggleBtn = githubPanel.querySelector('.ai-github-toggle');
      if (content && content.style.display === 'none') {
        content.style.display = 'block';
        if (toggleBtn) {
          toggleBtn.style.transform = 'rotate(0deg)';
        }
      }

      // Wait a moment for the scroll to finish
      await new Promise(resolve => setTimeout(resolve, 500));

      // Trigger the generate summary button
      const summarizeBtn = githubPanel.querySelector('.ai-github-summarize-btn');
      const resultDiv = githubPanel.querySelector('.ai-github-result');
      const resultContent = githubPanel.querySelector('.ai-github-result-content');
      
      if (summarizeBtn && resultDiv && resultContent) {
        await generateRepoSummary(summarizeBtn, resultDiv, resultContent);
      }
    } else {
      // If the panel does not exist, create it first
      insertGithubPanel();
      
      // Wait a moment for it to be inserted
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Scroll and execute
      if (githubPanel) {
        githubPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const summarizeBtn = githubPanel.querySelector('.ai-github-summarize-btn');
        const resultDiv = githubPanel.querySelector('.ai-github-result');
        const resultContent = githubPanel.querySelector('.ai-github-result-content');
        
        if (summarizeBtn && resultDiv && resultContent) {
          await generateRepoSummary(summarizeBtn, resultDiv, resultContent);
        }
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    summarizeRepo
  };
})();

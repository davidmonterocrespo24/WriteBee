/**
 * MarkdownRenderer - Renderiza markdown con soporte para código, tablas y matemáticas
 */
const MarkdownRenderer = (function() {

  /**
   * Escapa HTML para prevenir XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Detecta el lenguaje del bloque de código
   */
  function detectLanguage(code) {
    // Detectar JavaScript
    if (/\b(function|const|let|var|=>|async|await|import|export)\b/.test(code)) {
      return 'javascript';
    }
    // Detectar Python
    if (/\b(def|import|from|class|if __name__|print)\b/.test(code)) {
      return 'python';
    }
    // Detectar HTML
    if (/<\/?[a-z][\s\S]*>/i.test(code)) {
      return 'html';
    }
    // Detectar CSS
    if (/[.#][a-z-]+\s*\{[\s\S]*\}/i.test(code)) {
      return 'css';
    }
    return 'plaintext';
  }

  /**
   * Resalta sintaxis de código
   */
  function highlightCode(code, language) {
    const lang = language || detectLanguage(code);

    // Mapeo de palabras clave por lenguaje
    const keywords = {
      javascript: /\b(function|const|let|var|if|else|for|while|return|async|await|import|export|class|extends|new|this|try|catch|throw|typeof|instanceof|null|undefined|true|false)\b/g,
      python: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|async|await|True|False|None|self|and|or|not|in|is)\b/g,
      html: /(&lt;\/?[a-z][^&]*&gt;)/gi,
      css: /([.#][a-z-]+|\b[a-z-]+\s*:)/gi
    };

    const strings = /("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/g;
    const comments = {
      javascript: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
      python: /(#.*$)/gm,
      css: /(\/\*[\s\S]*?\*\/)/gm
    };
    const numbers = /\b(\d+\.?\d*)\b/g;

    let highlighted = escapeHtml(code);

    // Resaltar comentarios
    if (comments[lang]) {
      highlighted = highlighted.replace(comments[lang], '<span class="comment">$1</span>');
    }

    // Resaltar strings
    highlighted = highlighted.replace(strings, '<span class="string">$1</span>');

    // Resaltar palabras clave
    if (keywords[lang]) {
      highlighted = highlighted.replace(keywords[lang], '<span class="keyword">$1</span>');
    }

    // Resaltar números
    highlighted = highlighted.replace(numbers, '<span class="number">$1</span>');

    return highlighted;
  }

  /**
   * Renderiza un bloque de código
   */
  function renderCodeBlock(code, language) {
    const lang = language || detectLanguage(code);
    const highlighted = highlightCode(code, lang);

    return `<div class="code-block">
      <div class="code-header">
        <span class="code-language">${lang}</span>
        <button class="code-copy-btn" onclick="navigator.clipboard.writeText(this.dataset.code)" data-code="${escapeHtml(code)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          Copiar
        </button>
      </div>
      <pre><code class="language-${lang}">${highlighted}</code></pre>
    </div>`;
  }

  /**
   * Renderiza código inline
   */
  function renderInlineCode(code) {
    return `<code class="inline-code">${escapeHtml(code)}</code>`;
  }

  /**
   * Renderiza una tabla
   */
  function renderTable(header, rows) {
    let html = '<table class="markdown-table"><thead><tr>';

    // Header
    header.forEach(cell => {
      html += `<th>${cell}</th>`;
    });
    html += '</tr></thead><tbody>';

    // Rows
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${cell}</td>`;
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
  }

  /**
   * Renderiza expresiones matemáticas LaTeX (simplificado)
   */
  function renderMath(expression, inline = false) {
    // Para matemáticas completas, se podría integrar KaTeX o MathJax
    // Por ahora, renderizado básico
    const className = inline ? 'math-inline' : 'math-block';
    return `<span class="${className}">${escapeHtml(expression)}</span>`;
  }

  /**
   * Procesa y renderiza Markdown a HTML
   */
  function render(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // Bloques de código con triple backtick
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return renderCodeBlock(code.trim(), lang);
    });

    // Código inline
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      return renderInlineCode(code);
    });

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');

    // Listas desordenadas
    html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
    html = html.replace(/^- (.+)$/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

    // Listas ordenadas
    html = html.replace(/^\d+\. (.+)$/gim, '<li>$1</li>');

    // Blockquotes
    html = html.replace(/^> (.+)$/gim, '<blockquote>$1</blockquote>');

    // Líneas horizontales
    html = html.replace(/^---$/gim, '<hr>');
    html = html.replace(/^\*\*\*$/gim, '<hr>');

    // Tablas (formato: | col1 | col2 | col3 |)
    const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;
    html = html.replace(tableRegex, (match, headerRow, bodyRows) => {
      const headers = headerRow.split('|').map(h => h.trim()).filter(h => h);
      const rows = bodyRows.trim().split('\n').map(row =>
        row.split('|').map(c => c.trim()).filter(c => c)
      );
      return renderTable(headers, rows);
    });

    // Matemáticas en línea: $expresión$
    html = html.replace(/\$([^$]+)\$/g, (match, expr) => {
      return renderMath(expr, true);
    });

    // Matemáticas en bloque: $$expresión$$
    html = html.replace(/\$\$([^$]+)\$\$/g, (match, expr) => {
      return renderMath(expr, false);
    });

    // Saltos de línea (doble espacio o \n\n)
    html = html.replace(/\n\n/g, '<br><br>');
    html = html.replace(/  \n/g, '<br>');

    return html;
  }

  /**
   * Renderiza directamente en un elemento DOM
   */
  function renderToElement(element, markdown) {
    if (!element) return;
    // Almacenar el markdown anterior para evitar re-renders innecesarios
    const prevMarkdown = element.dataset.markdown || '';
    if (prevMarkdown !== markdown) {
      element.dataset.markdown = markdown;
      element.innerHTML = render(markdown);
    }
  }

  return {
    render,
    renderToElement,
    renderCodeBlock,
    highlightCode
  };
})();

window.MarkdownRenderer = MarkdownRenderer;

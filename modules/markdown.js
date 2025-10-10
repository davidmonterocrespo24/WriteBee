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
   * Escapa atributos HTML (para data-code)
   */
  function escapeAttribute(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Detecta el lenguaje del bloque de código
   */
  function detectLanguage(code) {
    if (/\b(function|const|let|var|=>|async|await|import|export)\b/.test(code)) {
      return 'javascript';
    }
    if (/\b(def|import|from|class|if __name__|print)\b/.test(code)) {
      return 'python';
    }
    if (/<\/?[a-z][\s\S]*>/i.test(code)) {
      return 'html';
    }
    if (/[.#][a-z-]+\s*\{[\s\S]*\}/i.test(code)) {
      return 'css';
    }
    return 'plaintext';
  }

  /**
   * Resalta sintaxis de código usando un approach de tokenización
   */
  function highlightCode(code, language) {
    const lang = language || detectLanguage(code);
    
    // Escapar HTML primero
    let escaped = escapeHtml(code);
    
    // Usar placeholders únicos para evitar conflictos
    const PLACEHOLDER = '___PLACEHOLDER___';
    let placeholderIndex = 0;
    const replacements = [];

    function addReplacement(html) {
      const placeholder = `${PLACEHOLDER}${placeholderIndex}${PLACEHOLDER}`;
      placeholderIndex++;
      replacements.push({ placeholder, html });
      return placeholder;
    }

    // Orden de procesamiento: comentarios -> strings -> keywords -> números
    // Esto evita que se solapen los regex

    // 1. Procesar comentarios primero
    if (lang === 'javascript' || lang === 'css') {
      escaped = escaped.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/)/gm, match => {
        return addReplacement(`<span class="comment">${match}</span>`);
      });
    } else if (lang === 'python') {
      escaped = escaped.replace(/(#.*$)/gm, match => {
        return addReplacement(`<span class="comment">${match}</span>`);
      });
    }

    // 2. Procesar strings
    escaped = escaped.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, match => {
      // No procesar si ya está dentro de un placeholder
      if (match.includes(PLACEHOLDER)) return match;
      return addReplacement(`<span class="string">${match}</span>`);
    });

    // 3. Procesar palabras clave
    const keywords = {
      javascript: /\b(function|const|let|var|if|else|for|while|return|async|await|import|export|class|extends|new|this|try|catch|throw|typeof|instanceof|null|undefined|true|false)\b/g,
      python: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|async|await|True|False|None|self|and|or|not|in|is)\b/g,
    };

    if (keywords[lang]) {
      escaped = escaped.replace(keywords[lang], match => {
        // No procesar si ya está dentro de un placeholder
        if (match.includes(PLACEHOLDER)) return match;
        return addReplacement(`<span class="keyword">${match}</span>`);
      });
    }

    // 4. Procesar números
    escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, match => {
      // No procesar si ya está dentro de un placeholder
      if (match.includes(PLACEHOLDER)) return match;
      return addReplacement(`<span class="number">${match}</span>`);
    });

    // Restaurar todos los placeholders
    replacements.forEach(({ placeholder, html }) => {
      escaped = escaped.replace(placeholder, html);
    });

    return escaped;
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
        <button class="code-copy-btn" onclick="navigator.clipboard.writeText(decodeURIComponent(this.dataset.code))" data-code="${encodeURIComponent(code)}">
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

    header.forEach(cell => {
      html += `<th>${escapeHtml(cell)}</th>`;
    });
    html += '</tr></thead><tbody>';

    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `<td>${escapeHtml(cell)}</td>`;
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
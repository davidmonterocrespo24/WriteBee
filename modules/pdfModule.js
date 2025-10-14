const PDFModule = (function() {
  let currentPDF = null;
  let currentPDFContent = null;

  /**
   * Extract text from PDF using multiple methods
   */
  async function extractTextFromPDF(pdfFile, onProgress = null) {
    try {
      if (onProgress) onProgress('Processing PDF...');




      // Método 1: Usar PDF.js si está disponible (mejor método)
      if (typeof pdfjsLib !== 'undefined') {

        if (onProgress) onProgress('Extracting text with PDF.js...');
        const pdfJsText = await extractWithPDFJS(pdfFile, onProgress);
        
        if (pdfJsText && pdfJsText.length > 50) {




          return {
            text: pdfJsText,
            pages: Math.ceil(pdfJsText.length / 2000),
            filename: pdfFile.name,
            size: pdfFile.size
          };
        }
      } else {
        console.warn('⚠️ PDF.js not available, trying alternative methods');
      }
      
      // Método 2: Extracción con regex mejorada
      if (onProgress) onProgress('Extracting text with regex patterns...');

      const regexText = await extractTextWithRegex(pdfFile);
      
      if (regexText && regexText.length > 50) {




        return {
          text: regexText,
          pages: Math.ceil(regexText.length / 2000),
          filename: pdfFile.name,
          size: pdfFile.size
        };
      }
      
      // Método 3: FileReader básico
      if (onProgress) onProgress('Trying basic text extraction...');

      const basicText = await extractWithFileReader(pdfFile);
      
      if (basicText && basicText.length > 50) {




        return {
          text: basicText,
          pages: Math.ceil(basicText.length / 2000),
          filename: pdfFile.name,
          size: pdfFile.size
        };
      }
      
      // Método 4: Fallback - informar que no se pudo extraer
      console.error('❌ PDF EXTRACTION: All extraction methods failed');

      throw new Error('Could not extract text from PDF. The file may be protected or a scanned image.');
      
    } catch (error) {
      console.error('❌ PDF EXTRACTION: Error extracting PDF text:', error);

      throw error;
    }
  }

  /**
   * Extract text using PDF.js library
   */
  async function extractWithPDFJS(pdfFile, onProgress = null) {
    try {

      // Read file as ArrayBuffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load PDF document
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let fullText = '';
      
      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        if (onProgress) onProgress(`Extracting page ${pageNum} of ${pdf.numPages}...`);

        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items
        const pageText = textContent.items
          .map(item => item.str)
          .join(' ');
        
        fullText += pageText + '\n\n';

      }


      return fullText.trim();
    } catch (error) {
      console.error('❌ PDF.js extraction failed:', error);
      return '';
    }
  }

  /**
   * Extract text using native browser PDF API
   */
  async function extractWithNativeAPI(pdfFile, onProgress) {
    // Esta función se ejecutará si el navegador tiene soporte nativo para PDFs
    throw new Error('Native PDF API not available');
  }

  /**
   * Extract text using FileReader (works with some PDFs)
   */
  async function extractWithFileReader(pdfFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const content = e.target.result;
          // Buscar texto legible en el contenido binario
          const textMatch = content.match(/BT\s*\/F\d+\s+\d+\s+Tf\s*(.*?)\s*ET/g);
          if (textMatch) {
            const extractedText = textMatch
              .map(match => match.replace(/BT\s*\/F\d+\s+\d+\s+Tf\s*/, '').replace(/\s*ET/, ''))
              .join(' ')
              .replace(/[^\w\s]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            resolve(extractedText);
          } else {
            resolve('');
          }
        } catch (error) {
          resolve('');
        }
      };
      
      reader.onerror = () => resolve('');
      reader.readAsText(pdfFile);
    });
  }

  /**
   * Extract text using AI (fallback method)
   */
  async function extractWithAI(pdfFile, onProgress) {
    if (onProgress) onProgress('Converting PDF to image for AI processing...');
    
    // Convertir PDF a imagen usando canvas (si es posible)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Crear una imagen del PDF (esto es una aproximación)
    const img = new Image();
    const url = URL.createObjectURL(pdfFile);
    
    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Convertir canvas a blob
          canvas.toBlob(async (blob) => {
            try {
              if (onProgress) onProgress('Using AI to extract text from PDF image...');
              
              // Usar MultimodalModule para extraer texto de la imagen
              if (window.MultimodalModule) {
                const extractedText = await MultimodalModule.describeImage(
                  blob, 
                  'Extract all visible text from this PDF page. Return ONLY the extracted text, nothing else.'
                );
                
                URL.revokeObjectURL(url);
                resolve({
                  text: extractedText,
                  pages: 1, // Asumimos 1 página por ahora
                  filename: pdfFile.name,
                  size: pdfFile.size
                });
              } else {
                throw new Error('MultimodalModule not available');
              }
            } catch (error) {
              URL.revokeObjectURL(url);
              reject(error);
            }
          }, 'image/png');
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load PDF as image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Simple text extraction from PDF using regex patterns
   */
  async function extractTextWithRegex(pdfFile) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = function(e) {
        try {
          const content = e.target.result;

          let extractedText = '';
          
          // Método 1: Buscar texto entre paréntesis (común en PDFs)
          const textInParentheses = content.match(/\(([^)]+)\)/g);
          if (textInParentheses && textInParentheses.length > 0) {

            extractedText = textInParentheses
              .map(match => {
                // Remove parentheses and clean
                let text = match.slice(1, -1);
                // Decode common PDF escape sequences
                text = text.replace(/\\n/g, '\n')
                          .replace(/\\r/g, '\r')
                          .replace(/\\t/g, '\t')
                          .replace(/\\\(/g, '(')
                          .replace(/\\\)/g, ')')
                          .replace(/\\\\/g, '\\');
                return text;
              })
              .filter(text => {
                // Filter out non-text content
                const hasLetters = /[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(text);
                const notTooShort = text.length > 1;
                const notAllSymbols = !/^[^a-zA-Z0-9\s]+$/.test(text);
                return hasLetters && notTooShort && notAllSymbols;
              })
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
          }

          if (extractedText.length > 0) {

          }
          
          resolve(extractedText);
        } catch (error) {
          console.error('❌ Regex extraction error:', error);
          resolve('');
        }
      };
      
      reader.onerror = () => {
        console.error('❌ FileReader error');
        resolve('');
      };
      
      reader.readAsText(pdfFile, 'ISO-8859-1'); // Try Latin-1 encoding for better PDF compatibility
    });
  }

  /**
   * Process and index PDF for chat
   */
  async function processPDFForChat(pdfFile, onProgress = null) {
    try {




      if (onProgress) onProgress('Processing PDF...');
      
      // Clear any existing PDF first
      if (currentPDF) {

        clearCurrentPDF();
      }
      
      // Extract text from PDF
      console.log('📄 Starting PDF text extraction...');
      const pdfData = await extractTextFromPDF(pdfFile, onProgress);

      console.log('📄 PDF extraction complete:');
      console.log('  - Filename:', pdfData.filename);
      console.log('  - Pages:', pdfData.pages);
      console.log('  - Text length:', pdfData.text ? pdfData.text.length : 0, 'characters');
      console.log('  - First 200 chars:', pdfData.text ? pdfData.text.substring(0, 200) : 'NO TEXT');

      // Store current PDF info
      currentPDF = {
        filename: pdfData.filename,
        pages: pdfData.pages,
        size: pdfData.size,
        uploadDate: new Date().toISOString()
      };
      
      currentPDFContent = pdfData.text;

      console.log('📦 Stored PDF content length:', currentPDFContent ? currentPDFContent.length : 0);

      if (onProgress) onProgress('Indexing PDF content...');
      
      // Initialize RAG Engine if not already done
      if (!window.RAGEngine) {
        throw new Error('RAG Engine not loaded');
      }
      
      const ragEngine = RAGEngine.getInstance();
      
      // Clear previous index (including web page content)

      ragEngine.clear();
      
      // Index PDF content
      console.log('📑 Indexing PDF content into RAG...');
      console.log('  - Content to index:', currentPDFContent.substring(0, 100) + '...');

      await ragEngine.indexPage(currentPDFContent, {
        title: currentPDF.filename,
        url: `pdf://${currentPDF.filename}`,
        source: 'pdf',
        pages: currentPDF.pages
      });

      const indexSize = ragEngine.index ? ragEngine.index.length : 0;
      console.log(`✅ PDF indexed successfully: ${indexSize} chunks created`);

      if (onProgress) onProgress('PDF ready for chat!');


        

      return {
        success: true,
        filename: currentPDF.filename,
        pages: currentPDF.pages,
        size: currentPDF.size
      };
    } catch (error) {
      console.error('❌ PDF PROCESSING: Error processing PDF:', error);
      throw error;
    }
  }

  /**
   * Chat with current PDF
   */
  async function chatWithPDF(question, onProgress = null) {
    try {




      if (!currentPDF || !currentPDFContent) {
        throw new Error('No PDF loaded. Please upload a PDF first.');
      }

      if (!window.RAGEngine) {
        throw new Error('RAG Engine not loaded');
      }

      const ragEngine = RAGEngine.getInstance();
      
      if (onProgress) onProgress('Searching PDF content...');

      // Retrieve only 3 chunks to keep prompt size manageable
      const relevantChunks = ragEngine.retrieve(question, 3);

      console.log(`📊 Retrieved ${relevantChunks.length} chunks for question: "${question}"`);

      // For small PDFs, use all content if RAG returns nothing
      if (relevantChunks.length === 0) {
        console.warn('⚠️ PDF CHAT: No relevant chunks found, using full PDF content');

        // For small PDFs (< 3000 chars), use all content directly
        if (currentPDFContent && currentPDFContent.length < 3000) {
          console.log('📄 Using full PDF content (small PDF)');
          const prompt = `Based on the PDF "${currentPDF.filename}", answer this question:

Content:
${currentPDFContent}

Question: ${question}

Answer clearly and directly using the information from the PDF.`;

          const answer = await AIModule.aiPrompt(prompt);
          return answer;
        }

        return 'I could not find relevant information in the PDF to answer your question. Could you rephrase the question?';
      }
      
      if (onProgress) onProgress('Generating answer...');
      
      // Build context from retrieved chunks with size limit

      let context = 'Relevant information from the PDF:\n\n';
      let totalChars = 0;
      const maxContextSize = 3000; // Limit context to 3000 chars
      
      for (let i = 0; i < relevantChunks.length; i++) {
        const chunk = relevantChunks[i];
        const chunkText = chunk.text.substring(0, 1000); // Limit each chunk to 1000 chars
        
        if (totalChars + chunkText.length > maxContextSize) {

          break;
        }
        
        context += `[${i + 1}] ${chunkText}\n\n`;
        totalChars += chunkText.length;

      }

      // Build optimized prompt
      const prompt = `Based on the PDF "${currentPDF.filename}", answer this question:

${context}

Question: ${question}

Answer clearly and directly using the information from the PDF. If the information is not sufficient, say so.`;






      if (prompt.length > 4000) {
        console.warn('⚠️ PDF CHAT: Prompt is very large, may fail');
      }

      const answer = await AIModule.aiPrompt(prompt);



      return answer;
    } catch (error) {
      console.error('❌ PDF CHAT: Error in chatWithPDF:', error);
      
      // Better error message for large inputs
      if (error.message && error.message.includes('too larg')) {
        return '❌ The content is too large. Please ask a more specific question so I can search for more precise information in the PDF.';
      }
      
      throw error;
    }
  }

  /**
   * Get summary of current PDF
   */
  async function summarizePDF(onProgress = null) {
    try {



      if (!currentPDF || !currentPDFContent) {
        throw new Error('No PDF loaded. Please upload a PDF first.');
      }

      if (onProgress) onProgress('Analyzing PDF structure...');

      if (!window.RAGEngine) {
        throw new Error('RAG Engine not loaded');
      }

      const ragEngine = RAGEngine.getInstance();
      
      // Get key chunks using a summarization query

      const summaryQuery = 'main topics key points important information summary overview';
      const relevantChunks = ragEngine.retrieve(summaryQuery, 5); // Reduced from 8 to 5

      if (onProgress) onProgress('Generating summary...');

      // Build context with size limit
      let context = '';
      let totalChars = 0;
      const maxContextSize = 2500; // Limit for summary
      
      for (let i = 0; i < relevantChunks.length; i++) {
        const chunk = relevantChunks[i];
        const chunkText = chunk.text.substring(0, 800); // Limit each chunk
        
        if (totalChars + chunkText.length > maxContextSize) {

          break;
        }
        
        context += `${chunkText}\n\n`;
        totalChars += chunkText.length;
      }

      const prompt = `Summarize this PDF clearly and concisely:

File: ${currentPDF.filename}
Pages: ${currentPDF.pages}

Content:
${context}

Create a structured summary with the main points.`;




      const summary = await AIModule.aiSummarize(prompt);


      return summary;
    } catch (error) {
      console.error('❌ PDF SUMMARY: Error in summarizePDF:', error);
      
      if (error.message && error.message.includes('too larg')) {
        return '❌ The PDF is too large to summarize. Try asking specific questions about the content.';
      }
      
      throw error;
    }
  }

  /**
   * Extract key points from PDF
   */
  async function extractKeyPointsFromPDF(onProgress = null) {
    try {



      if (!currentPDF || !currentPDFContent) {
        throw new Error('No PDF loaded. Please upload a PDF first.');
      }

      if (onProgress) onProgress('Extracting key points...');

      if (!window.RAGEngine) {
        throw new Error('RAG Engine not loaded');
      }

      const ragEngine = RAGEngine.getInstance();
      
      // Retrieve diverse chunks

      const query = 'important key main essential critical significant';
      const relevantChunks = ragEngine.retrieve(query, 5); // Reduced from 10 to 5

      // Build context with size limit
      let context = '';
      let totalChars = 0;
      const maxContextSize = 2500;
      
      for (let i = 0; i < relevantChunks.length; i++) {
        const chunk = relevantChunks[i];
        const chunkText = chunk.text.substring(0, 800);
        
        if (totalChars + chunkText.length > maxContextSize) {

          break;
        }
        
        context += `${chunkText}\n\n`;
        totalChars += chunkText.length;
      }

      const prompt = `Extract the key points from this PDF as bullets:

File: ${currentPDF.filename}

Content:
${context}

List the most important points in bullet format.`;




      const result = await AIModule.aiPrompt(prompt);


      return result;
    } catch (error) {
      console.error('❌ PDF KEY POINTS: Error in extractKeyPointsFromPDF:', error);
      
      if (error.message && error.message.includes('too larg')) {
        return '❌ The PDF is too large. Try asking more specific questions.';
      }
      
      throw error;
    }
  }

  /**
   * Get current PDF info
   */
  function getCurrentPDFInfo() {
    return currentPDF ? { ...currentPDF } : null;
  }

  /**
   * Clear current PDF
   */
  function clearCurrentPDF() {
    currentPDF = null;
    currentPDFContent = null;
    
    // Clear RAG index
    if (window.RAGEngine) {
      const ragEngine = RAGEngine.getInstance();
      ragEngine.clear();
    }

  }

  /**
   * Check if PDF is currently loaded
   */
  function hasPDFLoaded() {
    return currentPDF !== null;
  }

  return {
    extractTextFromPDF,
    processPDFForChat,
    chatWithPDF,
    summarizePDF,
    extractKeyPointsFromPDF,
    getCurrentPDFInfo,
    clearCurrentPDF,
    hasPDFLoaded
  };
})();

// Export
if (typeof window !== 'undefined') {
  window.PDFModule = PDFModule;
}



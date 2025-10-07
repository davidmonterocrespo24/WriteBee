# AI Text Assistant - Features Documentation

## 🆕 New Features

### 1. 🔤 Image AI Features - OCR, Explain & Describe

Powerful image analysis using Chrome's Multimodal API.

**How to use:**
Right-click on any image on the web and select:

**🔤 Extract Text (OCR)**
- Extracts all visible text from the image
- High accuracy for printed text
- Supports multiple languages
- Copy, summarize, or translate extracted text

**💡 Explain Image**
- Get a detailed explanation of what the image shows
- Understand context and meaning
- Perfect for educational content, diagrams, charts
- AI explains concepts visible in the image

**🖼️ Describe Image**
- Detailed visual description of the image
- Lists all visible elements
- Useful for accessibility
- Comprehensive scene description

**After processing, you can:**
- Copy the result
- Summarize it
- Translate it
- Apply any AI action to the text/description

**Technical Details:**
- Uses Chrome's built-in Multimodal AI API
- Works offline once the model is downloaded
- Supports multiple languages
- Streaming responses for real-time feedback

---

### 2. 📚 Grammar Checker

Check grammar and spelling directly from the context menu.

**How to use:**
- Select any text on a webpage
- Right-click and select "Check Grammar"
- Or use the Grammar button in the AI toolbar
- Corrections and suggestions appear in a dialog

**Features:**
- Automatic language detection
- Grammar and spelling corrections
- Style suggestions
- Works with multiple languages

---

### 3. 📄 PDF Translation Tool

Translate complete PDF documents while maintaining the original layout.

**How to use:**
- Open any PDF file in Chrome
- A PDF toolbar will appear in the top-right corner
- Click "Translate" to translate the entire PDF
- Select your target language
- The translated text appears in a dialog

**Features:**
- Full PDF text extraction
- Maintains document structure
- Multiple language support
- OCR for scanned PDFs (coming soon)

---

### 4. 💬 Chat with Web Pages

Chat directly with any webpage to ask questions about its content.

**How to use:**
1. Press **Ctrl+M** to open the AI Chat panel
2. Click on **"💬 Chat with this page"** suggestion chip
3. The chat will load the current page content automatically
4. Ask any questions about the page

**Features:**
- Automatic page content extraction
- Context-aware responses based on page content
- Page summarization
- Key points extraction
- Multi-language support
- Integrated into main chat panel

**Alternative access:**
- Right-click anywhere on the page
- Select "Chat with this Page" from context menu
- Chat panel opens with page context loaded

---

### 5. 📑 Chat with PDF

Make your PDFs interactive - ask questions, get summaries, translate content.

**How to use:**
- Open any PDF in Chrome
- Use the PDF toolbar (top-right)
- Click "Chat" to start an interactive session
- Ask questions about the PDF content

**Features:**
- Interactive Q&A with PDF documents
- PDF summarization
- PDF translation
- OCR for scanned PDFs
- Extract specific information

---

### 6. 💾 Prompt Library

Create and save custom prompts for quick reuse.

**How to use:**

**Via Toolbar:**
1. Select text
2. Click the settings icon (⚙️) in the toolbar
3. Browse saved prompts or create new ones
4. Press "/" to quickly access prompts

**Via Side Panel:**
1. Open the side panel
2. Click the settings button
3. Manage your prompt library

**Creating Custom Prompts:**
1. Click "+ Add Custom Prompt"
2. Enter:
   - Prompt name
   - Icon (emoji)
   - Category
   - Prompt template (use `{variable}` for parameters)
3. Save and use anytime with "/"

**Default Prompts:**
- 📄 Summarize
- 🌐 Translate to {language}
- 💡 Explain
- 📚 Fix Grammar
- 💼 Make Professional
- 😊 Make Casual
- 📧 Write Email
- • Convert to Bullet Points
- 🔍 Expand
- ✨ Simplify

**Quick Access:**
- Type "/" in any text input
- Search prompts by name
- Execute with one click
- Edit or delete custom prompts

---

## 🛠️ Settings & Configuration

### Accessing Settings

**From Toolbar:**
- Click the gear icon (⚙️)

**From Side Panel:**
- Click the settings button in the panel header

### Settings Sections

1. **Prompt Library**
   - View all saved prompts
   - Create custom prompts
   - Edit or delete prompts
   - Import/Export prompt collections

2. **AI Preferences**
   - Default language
   - Response style
   - Model temperature (coming soon)

3. **Shortcuts**
   - Keyboard shortcuts
   - Quick actions
   - Custom key bindings (coming soon)

---

## 🎯 Context Menu Actions

Right-click context menu options:

**For Images:**
- 🔤 Extract Text (OCR) - Extract all visible text
- 💡 Explain Image - Get detailed explanation
- 🖼️ Describe Image - Visual description for accessibility

**For Selected Text:**
- 📚 Check Grammar
- All standard AI actions (summarize, translate, etc.)

**For Pages:**
- 💬 Chat with this Page
- 📄 Summarize Page
- 🌐 Translate Page

**For PDFs:**
- Use the dedicated PDF toolbar

---

## 🚀 Quick Tips

1. **OCR Best Practices:**
   - Works best with clear, high-resolution images
   - Supports printed text better than handwriting
   - Try different languages if detection fails

2. **PDF Features:**
   - Large PDFs may take longer to process
   - For best results, use text-based PDFs
   - Scanned PDFs require OCR (in development)

3. **Web Chat:**
   - Works on most websites
   - Better results with article/blog content
   - Can handle complex pages with multiple sections

4. **Prompt Library:**
   - Use `{language}`, `{tone}`, `{style}` as variables
   - Create prompts for repetitive tasks
   - Share prompts by exporting/importing

5. **Performance:**
   - First use downloads AI models (one-time)
   - Subsequent uses are faster and work offline
   - Clear cache if experiencing issues

---

## 🔧 Troubleshooting

**OCR not working?**
- Ensure Chrome AI features are enabled
- Check if the image is accessible (not blocked by CORS)
- Try a different image format

**PDF features not showing?**
- Refresh the page after opening the PDF
- Ensure the PDF is loaded completely
- Check browser console for errors

**Chat not responding?**
- Verify Chrome AI is available (chrome://flags)
- Check internet connection for first-time model download
- Clear browser cache and reload

**Prompt Library not saving?**
- Check storage permissions
- Ensure you have enough storage space
- Try exporting and re-importing prompts

---

## 📋 Keyboard Shortcuts

- `/` - Open prompt library (in text inputs)
- `Ctrl+Shift+G` - Check grammar (coming soon)
- `Ctrl+Shift+S` - Summarize selection (coming soon)
- `Ctrl+Shift+C` - Open chat panel (coming soon)

---

## 🔐 Privacy & Security

- All processing happens locally using Chrome's built-in AI
- No data is sent to external servers
- Prompts and settings stored locally
- OCR and AI models downloaded once and cached
- No tracking or analytics

---

## 🆘 Support

For issues or feature requests:
1. Check this documentation
2. Review the troubleshooting section
3. Open an issue on GitHub
4. Contact support

---

## 📝 Changelog

### Version 2.0
- ✨ Added OCR text extraction from images
- ✨ Added Grammar Checker
- ✨ Added PDF Translation Tool
- ✨ Added Chat with Web Pages
- ✨ Added Chat with PDF
- ✨ Added Prompt Library with custom prompts
- ✨ Added Settings panel
- 🔧 Improved context menu integration
- 🔧 Enhanced multi-language support

### Version 1.0
- Initial release with basic AI text actions

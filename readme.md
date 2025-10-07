# 🤖 AI Text Assistant - Chrome Extension

AI-powered text assistant for Chrome that helps you work with text on any website, with special integrations for Gmail and YouTube.

## ✨ Main Features

### 📝 Universal Text Assistant
- **Summarize** - Summarize any selected text
- **Translate** - Translate to multiple languages
- **Explain** - Explain complex concepts
- **Grammar** - Review and correct errors
- **Rewrite** - Improve writing
- **Expand** - Add more details
- **Answer** - Answer questions

### 📧 Gmail Integration
When viewing an email in Gmail:
1. An **"AI Response"** button appears in the toolbar
2. Clicking opens a dialog that:
   - 📋 **Automatically summarizes the received email**
   - ✍️ **Requests your input** on what to include in the response
   - 🤖 **Generates a professional response** based on context
   - ✏️ **Allows editing** the response before sending
   - 📤 **Inserts directly** into Gmail editor

### 📺 YouTube Integration
When watching a video on YouTube:
1. An **AI panel** appears above the recommended videos list
2. The panel allows you to:
   - 📋 **Summarize the video** using available subtitles
   - ⏱️ **Include timestamps** in the summary
   - 🎯 **Extract key points** from the content
   - 📄 **Copy and regenerate** the summary
   - ✅ **Works with subtitles** in Spanish and English

## 🚀 Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable **Developer mode** (top right corner)
4. Click **"Load unpacked extension"**
5. Select the extension folder

## 🎯 How to Use

### General Use
1. Select any text on a web page
2. A floating toolbar will appear
3. Click on the desired action (summarize, translate, etc.)
4. The result appears in an interactive dialog

### In Gmail
1. Open an email
2. Click the purple **"AI Response"** button
3. Read the email summary
4. Write what you want to include in your response
5. Click **"Generate Response"**
6. Edit if necessary
7. Click **"Insert in Gmail"**

### On YouTube
1. Open a video with available subtitles
2. Look for the AI panel above recommended videos
3. Select the options you want (timestamps, key points)
4. Click **"Generate Video Summary"**
5. Read, copy or regenerate the summary as needed

## 🛠️ Requirements

- Google Chrome with support for Chrome AI APIs
- The following APIs must be available:
  - Summarizer API
  - Translator API
  - LanguageModel API (Prompt API)
  - Proofreader API
  - Rewriter API
  - Writer API
  - LanguageDetector API

## 📁 Project Structure

```
extensionAI2/
├── manifest.json          # Extension configuration
├── content.js            # Main content script
├── styles.css            # Global styles
├── modules/
│   ├── actions.js        # Actions management
│   ├── ai.js            # AI APIs interface
│   ├── aiService.js     # AI service (main logic)
│   ├── dialog.js        # Interactive dialogs
│   ├── markdown.js      # Markdown renderer
│   ├── menus.js         # Context menus
│   ├── toolbar.js       # Floating toolbar
│   ├── gmail.js         # 📧 Gmail integration
│   └── youtube.js       # 📺 YouTube integration
└── readme.md            # This file
```

## 🎨 Dialog Features

- **Draggable** - Move the dialog wherever you want
- **Pinnable** - Keep multiple dialogs open
- **Follow-up chat** - Ask additional questions
- **Copy results** - One click to copy
- **Regenerate** - Get alternative responses
- **Edit** - Modify the responses
- **Read aloud** - Listen to the responses
- **Mode switching** - Change between actions without closing

## 🔧 API Configuration

The extension uses native Chrome AI APIs. Make sure you have:

1. Chrome Canary or Dev (latest version)
2. Flags enabled in `chrome://flags`:
   - `#optimization-guide-on-device-model`
   - `#prompt-api-for-gemini-nano`
   - `#summarization-api-for-gemini-nano`
   - `#translation-api`

## 📝 Notes

### Gmail
- The extension automatically detects when you open Gmail
- Works best with text-format emails
- Generated response can be edited before inserting

### YouTube
- The video **must have available subtitles**
- Works with automatic or manual subtitles
- Prefers subtitles in Spanish, then English
- Summary may take time depending on video length

## 🐛 Troubleshooting

### APIs are not available
- Verify you are using Chrome Canary/Dev
- Check the flags in `chrome://flags`
- Restart Chrome after changing flags

### Button doesn't appear in Gmail
- Refresh the Gmail page
- Verify the extension is enabled
- Check browser console for errors

### Can't get YouTube subtitles
- Verify the video has subtitles (CC)
- Manually activate subtitles if not automatic
- Some private videos may not work

## 🚀 Upcoming Features

- [ ] More customization options
- [ ] Support for more languages
- [ ] Integration with more services (Twitter, LinkedIn, etc.)
- [ ] Custom response templates
- [ ] History of generated responses
- [ ] Dark/light mode

## 📄 License

This project is open source and available under the MIT license.

## 🤝 Contributions

Contributions are welcome. Please:
1. Fork the repository
2. Create a branch for your feature
3. Commit your changes
4. Submit a pull request

## 📧 Contact

For questions, suggestions or to report bugs, please open an issue in the repository.

---

**Made with ❤️ using Chrome AI APIs**

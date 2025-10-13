/**
 * Microphone Permission Module
 * Handles microphone permission request via an overlay on the current page
 */

const MicrophonePermissionModule = (function() {
  let permissionOverlay = null;
  let mediaRecorder = null;
  let audioChunks = [];
  let isRecording = false;
  let recordingStream = null;

  /**
   * Show permission request overlay on current page
   */
  function showPermissionOverlay() {
    return new Promise((resolve, reject) => {
      // Check if overlay already exists
      if (permissionOverlay) {
        permissionOverlay.remove();
      }

      // Create overlay
      permissionOverlay = document.createElement('div');
      permissionOverlay.id = 'writebee-mic-permission-overlay';
      permissionOverlay.innerHTML = `
        <style>
          #writebee-mic-permission-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2147483647;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            animation: writebee-fadeIn 0.3s ease;
          }

          @keyframes writebee-fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          .writebee-mic-modal {
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 450px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            animation: writebee-slideUp 0.3s ease;
          }

          @keyframes writebee-slideUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .writebee-mic-icon {
            font-size: 64px;
            margin-bottom: 20px;
            animation: writebee-pulse 2s infinite;
          }

          @keyframes writebee-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }

          .writebee-mic-modal h2 {
            color: #1a1a1a;
            margin-bottom: 15px;
            font-size: 24px;
            font-weight: 600;
          }

          .writebee-mic-modal p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 25px;
            font-size: 15px;
          }

          .writebee-mic-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
          }

          .writebee-mic-btn {
            padding: 12px 30px;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .writebee-mic-btn-primary {
            background: #ffd400;
            color: #1a1a1a;
            box-shadow: 0 4px 15px rgba(255, 212, 0, 0.3);
          }

          .writebee-mic-btn-primary:hover {
            background: #ffb700;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(255, 212, 0, 0.4);
          }

          .writebee-mic-btn-secondary {
            background: #f0f0f0;
            color: #666;
          }

          .writebee-mic-btn-secondary:hover {
            background: #e0e0e0;
          }

          .writebee-mic-status {
            margin-top: 20px;
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            display: none;
          }

          .writebee-mic-status.success {
            background: #d4edda;
            color: #155724;
            display: block;
          }

          .writebee-mic-status.error {
            background: #f8d7da;
            color: #721c24;
            display: block;
          }

          .writebee-mic-loading {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(0, 0, 0, 0.1);
            border-left-color: #1a1a1a;
            border-radius: 50%;
            animation: writebee-spin 0.8s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
          }

          @keyframes writebee-spin {
            to { transform: rotate(360deg); }
          }
        </style>

        <div class="writebee-mic-modal">
          <div class="writebee-mic-icon">🎤</div>
          <h2>Permiso de Micrófono</h2>
          <p>WriteBee necesita acceso al micrófono para grabar y transcribir tu voz.</p>
          <p style="font-size: 13px; color: #999;">Cuando hagas clic en "Permitir", el navegador te pedirá permiso.</p>

          <div class="writebee-mic-buttons">
            <button class="writebee-mic-btn writebee-mic-btn-secondary" id="writebee-mic-cancel">
              Cancelar
            </button>
            <button class="writebee-mic-btn writebee-mic-btn-primary" id="writebee-mic-allow">
              Permitir Micrófono
            </button>
          </div>

          <div class="writebee-mic-status" id="writebee-mic-status"></div>
        </div>
      `;

      document.body.appendChild(permissionOverlay);

      // Button handlers
      const allowBtn = document.getElementById('writebee-mic-allow');
      const cancelBtn = document.getElementById('writebee-mic-cancel');
      const statusDiv = document.getElementById('writebee-mic-status');

      // Cancel button
      cancelBtn.addEventListener('click', () => {
        permissionOverlay.remove();
        reject(new Error('User cancelled permission request'));
      });

      // Allow button
      allowBtn.addEventListener('click', async () => {
        allowBtn.disabled = true;
        allowBtn.innerHTML = '<span class="writebee-mic-loading"></span>Solicitando...';

        try {
          // Request microphone permission
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

          // Success! Stop the stream immediately
          stream.getTracks().forEach(track => track.stop());

          // Show success message
          statusDiv.className = 'writebee-mic-status success';
          statusDiv.textContent = '✅ ¡Permiso otorgado! Ahora puedes usar la grabación.';

          // Close overlay after 1.5 seconds
          setTimeout(() => {
            permissionOverlay.remove();
            resolve(true);
          }, 1500);

        } catch (error) {
          console.error('Microphone permission denied:', error);

          let errorMessage = '❌ ';
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage += 'Permiso denegado. Por favor, acepta el permiso cuando el navegador te lo pida.';
          } else if (error.name === 'NotFoundError') {
            errorMessage += 'No se encontró ningún micrófono. Verifica que esté conectado.';
          } else if (error.name === 'NotReadableError') {
            errorMessage += 'El micrófono está siendo usado por otra aplicación.';
          } else {
            errorMessage += error.message;
          }

          statusDiv.className = 'writebee-mic-status error';
          statusDiv.textContent = errorMessage;

          allowBtn.disabled = false;
          allowBtn.textContent = 'Intentar de Nuevo';

          // Don't auto-close on error
          reject(error);
        }
      });

      // Close on overlay click (outside modal)
      permissionOverlay.addEventListener('click', (e) => {
        if (e.target === permissionOverlay) {
          permissionOverlay.remove();
          reject(new Error('User cancelled permission request'));
        }
      });
    });
  }

  /**
   * Request microphone permission
   * Returns true if permission granted, false otherwise
   */
  async function requestPermission() {
    try {
      await showPermissionOverlay();
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  /**
   * Check if microphone permission is already granted
   */
  async function checkPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Start recording audio in the page context
   */
  async function startRecording() {
    if (isRecording) {
      console.warn('Already recording');
      return { success: false, error: 'Already recording' };
    }

    try {
      console.log('MIC_MODULE: Starting recording...');

      // Request microphone access
      recordingStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      console.log('MIC_MODULE: Got media stream');

      // Create MediaRecorder
      mediaRecorder = new MediaRecorder(recordingStream, { mimeType: 'audio/webm' });
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('MIC_MODULE: Data available', event.data.size);
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('MIC_MODULE: Recording stopped');

        // Stop all tracks
        if (recordingStream) {
          recordingStream.getTracks().forEach(track => track.stop());
          recordingStream = null;
        }

        // Create blob from chunks
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log('MIC_MODULE: Audio blob created', audioBlob.size, 'bytes');

        // Convert blob to ArrayBuffer for transmission
        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          console.log('MIC_MODULE: Converted to ArrayBuffer', arrayBuffer.byteLength, 'bytes');

          // Send to background script
          chrome.runtime.sendMessage({
            type: 'audio-recorded-from-page',
            audioData: Array.from(new Uint8Array(arrayBuffer)),
            mimeType: 'audio/webm'
          });
        } catch (error) {
          console.error('MIC_MODULE: Error converting audio:', error);
        }

        isRecording = false;
        mediaRecorder = null;
        audioChunks = [];
      };

      mediaRecorder.onerror = (error) => {
        console.error('MIC_MODULE: MediaRecorder error', error);
        if (recordingStream) {
          recordingStream.getTracks().forEach(track => track.stop());
          recordingStream = null;
        }
        isRecording = false;
      };

      // Start recording
      mediaRecorder.start();
      isRecording = true;

      console.log('MIC_MODULE: Recording started successfully');
      return { success: true };

    } catch (error) {
      console.error('MIC_MODULE: Error starting recording', error);
      if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
        recordingStream = null;
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop recording audio
   */
  function stopRecording() {
    console.log('MIC_MODULE: Stopping recording...');
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      return { success: true };
    } else {
      console.warn('MIC_MODULE: No active recording to stop');
      return { success: false, error: 'No active recording' };
    }
  }

  /**
   * Get recording status
   */
  function getRecordingStatus() {
    return {
      isRecording: isRecording,
      state: mediaRecorder ? mediaRecorder.state : 'inactive'
    };
  }

  return {
    requestPermission,
    checkPermission,
    startRecording,
    stopRecording,
    getRecordingStatus
  };
})();

// Make it available globally
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MicrophonePermissionModule;
}

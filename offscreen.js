/**
 * Offscreen document para grabación de audio
 * @author David Montero Crespo
 * @project WriteBee
 */

let recorder;
let data = [];

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target !== 'offscreen') {
    return;
  }

  if (message.type === 'start-recording') {
    if (recorder?.state === 'recording') {
      console.error('Recording is already in progress.');
      chrome.runtime.sendMessage({
        type: 'recording-error',
        error: { name: 'AlreadyRecording', message: 'Recording is already in progress.' }
      });
      return;
    }


    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });


      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => {
        data.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(data, { type: 'audio/webm' });
        chrome.runtime.sendMessage({ type: 'audio-recorded', data: blob });
        data = [];
        stream.getTracks().forEach(t => t.stop());
        recorder = null;
      };
      recorder.onerror = (error) => {
        console.error('OFFSCREEN: Recorder error', error);
        chrome.runtime.sendMessage({
          type: 'recording-error',
          error: { name: error.name || 'RecordingError', message: error.message || 'Recording failed' }
        });
      };
      recorder.start();

      // Notify that recording started successfully
      chrome.runtime.sendMessage({ type: 'recording-started' });
    } catch (error) {
      console.error('OFFSCREEN: Error accessing microphone', error);
      chrome.runtime.sendMessage({
        type: 'recording-error',
        error: { name: error.name, message: error.message }
      });
    }
  } else if (message.type === 'stop-recording') {
    if (recorder?.state === 'recording') {
      recorder.stop();
    } else {
      console.warn('OFFSCREEN: No active recording to stop');
    }
  }
});

// Creado por David Montero Crespo para WriteBee

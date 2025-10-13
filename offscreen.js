// Offscreen document for audio recording

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

    console.log('OFFSCREEN: Starting recording...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      console.log('OFFSCREEN: Got media stream', stream);

      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      recorder.ondataavailable = (e) => {
        console.log('OFFSCREEN: Data available', e.data.size);
        data.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(data, { type: 'audio/webm' });
        console.log('OFFSCREEN: Audio blob created', blob.size, 'bytes');
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
      console.log('OFFSCREEN: Recorder started');

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
    console.log('OFFSCREEN: Stop recording requested');
    if (recorder?.state === 'recording') {
      recorder.stop();
      console.log('OFFSCREEN: Recorder stopped');
    } else {
      console.warn('OFFSCREEN: No active recording to stop');
    }
  }
});

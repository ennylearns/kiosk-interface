import { useState, useRef, useCallback, useEffect } from 'react';

interface UseVoiceWebSocketProps {
  onTranscription: (text: string) => void;
}

export function useVoiceWebSocket({ onTranscription }: UseVoiceWebSocketProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket('ws://localhost:8080');
    
    ws.onopen = () => {
      console.log('Connected to voice WebSocket server');
      setError(null);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript' && data.text) {
          onTranscription(data.text);
        }
      } catch (e) {
        console.error('Failed to parse websocket message', e);
      }
    };

    ws.onerror = () => {
      console.error('WebSocket error');
      setError('Failed to connect to voice server');
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    wsRef.current = ws;
  }, [onTranscription]);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const startRecording = useCallback(async () => {
    try {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        connectWebSocket();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data);
        }
      };

      // Send chunks every 250ms
      mediaRecorder.start(250);
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error('Error accessing microphone', err);
      setError('Could not access microphone');
      setIsRecording(false);
    }
  }, [connectWebSocket]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording
  };
}

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';
import { parseLocationQuery } from './lib/locationParser';
import locations from './data/locations.json';
import { useVoiceWebSocket } from './hooks/useVoiceWebSocket';

function App() {
  const [status, setStatus] = useState<'idle' | 'listening' | 'confirming' | 'result'>('idle');
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [destinationName, setDestinationName] = useState<string | null>(null);

  const handleTranscription = useCallback((transcript: string) => {
    console.log('Received transcript from server:', transcript);
    
    const locationId = parseLocationQuery(transcript);
    
    if (locationId) {
      const location = locations.find(loc => loc.id === locationId);
      if (location) {
        setDestinationName(location.name);
        setDestinationId(locationId);
        setStatus('confirming');
      }
    } else {
      setStatus('idle');
    }
  }, []);

  const { startRecording, stopRecording } = useVoiceWebSocket({
    onTranscription: handleTranscription
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setStatus(prev => prev === 'idle' ? 'listening' : 'idle');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (status === 'confirming') {
      timer = setTimeout(() => {
        setStatus('result');
      }, 3000);
    } else if (status === 'result') {
      timer = setTimeout(() => {
        setStatus('idle');
        setDestinationId(null);
        setDestinationName(null);
      }, 30000);
    }
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'listening') {
      startRecording();
    } else {
      stopRecording();
    }
  }, [status, startRecording, stopRecording]);

  return (
    <div className="kiosk-container">
      {status === 'idle' && (
        <main className="idle-screen">
          <img src="/cropped-AFIT.png" alt="AFIT Logo" className="school-logo" />
          <div className="microphone-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
          </div>
          <h1 className="welcome-message">WELCOME TO AFIT</h1>
          <p className="prompt-message">PRESS BUTTON TO SPEAK</p>
        </main>
      )}

      {status === 'listening' && (
        <main className="listening-screen">
          <div className="waveform-container">
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
            <div className="bar"></div>
          </div>
          <h1 className="listening-text">Listening...</h1>
        </main>
      )}

      {status === 'confirming' && (
        <main className="confirming-screen">
          <h1 className="result-title">Navigating to <b>{destinationName}</b>...</h1>
        </main>
      )}

      {status === 'result' && (
        <main className="result-screen">
          <h1 className="result-title">Scan to Navigate</h1>
          <div className="qr-container">
            <QRCodeSVG value={`https://static-maps.vercel.app/?to=${destinationId}`} size={256} bgColor="transparent" fgColor="#0c4a6e" level="H" includeMargin={false} />
          </div>
          <p className="result-instruction">Scan this code with your mobile device.</p>
        </main>
      )}
    </div>
  );
}

export default App;

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';
import { parseLocationQuery } from './lib/locationParser';
import locations from './data/locations.json';

function App() {
  const [status, setStatus] = useState<'idle' | 'listening' | 'result'>('idle');
  const [destinationId, setDestinationId] = useState<string | null>(null);

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
    if (status === 'result') {
      timer = setTimeout(() => {
        setStatus('idle');
        setDestinationId(null);
      }, 30000);
    }
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (status === 'listening') {
      const SpeechRecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor();
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log('Received transcript:', transcript);
          
          const locationId = parseLocationQuery(transcript);
          let utteranceText = "Sorry, I didn't catch that location. Please try again.";
          if (locationId) {
            const location = locations.find(loc => loc.id === locationId);
            if (location) {
              utteranceText = `Navigating to ${location.name}`;
              setDestinationId(locationId);
            }
          }
          
          const utterance = new SpeechSynthesisUtterance(utteranceText);
          utterance.onend = () => {
            if (locationId) {
              setStatus('result');
            } else {
              setStatus('idle');
            }
          };
          window.speechSynthesis.speak(utterance);
        };

        recognition.start();

        // Optional cleanup
        return () => recognition.stop();
      }
    }
  }, [status]);

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

      {status === 'result' && (
        <main className="result-screen">
          <h1 className="result-title">Scan to Navigate</h1>
          <div className="qr-container">
            <QRCodeSVG value={`https://map.afit.edu/?to=${destinationId}`} size={256} bgColor="#ffffff" fgColor="#000000" level="H" />
          </div>
          <p className="result-instruction">Scan this code with your mobile device.</p>
        </main>
      )}
    </div>
  );
}

export default App;

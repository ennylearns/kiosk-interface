import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from './App';
import { setupSpeechMock, teardownSpeechMock, currentMockRecognition } from './lib/speechMock';

describe('Idle Screen', () => {
  it('displays a welcoming message', () => {
    render(<App />);
    const welcomeMessage = screen.getByText(/WELCOME TO AFIT/i);
    expect(welcomeMessage).toBeInTheDocument();
  });

  it('displays a visual prompt to press a button to start', () => {
    render(<App />);
    const promptMessage = screen.getByText(/PRESS BUTTON TO SPEAK/i);
    expect(promptMessage).toBeInTheDocument();
  });
});

describe('Hardware Activation', () => {
  beforeEach(() => {
    setupSpeechMock();
    vi.stubGlobal('speechSynthesis', { speak: vi.fn() });
    vi.stubGlobal('SpeechSynthesisUtterance', vi.fn());
  });

  afterEach(() => {
    teardownSpeechMock();
    vi.clearAllMocks();
  });

  it('transitions to Listening state when Spacebar is pressed', () => {
    render(<App />);
    
    // Initial state
    expect(screen.getByText(/WELCOME TO AFIT/i)).toBeInTheDocument();
    expect(screen.queryByText(/Listening\.\.\./i)).not.toBeInTheDocument();

    // Simulate physical button press via Spacebar
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    // Should transition to listening state
    expect(screen.queryByText(/WELCOME TO AFIT/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Listening\.\.\./i)).toBeInTheDocument();
  });

  it('starts SpeechRecognition when transitioning to Listening state', () => {
    render(<App />);
    
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    expect(currentMockRecognition).not.toBeNull();
    expect(currentMockRecognition?.start).toHaveBeenCalledTimes(1);
  });

  it('receives simulated speech transcript in the background', () => {
    const consoleSpy = vi.spyOn(console, 'log');
    render(<App />);
    
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    expect(currentMockRecognition).not.toBeNull();
    
    act(() => {
      currentMockRecognition?.simulateResult('where is the library');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Received transcript:', 'where is the library');
    consoleSpy.mockRestore();
  });

  it('stops listening and returns to Idle when Spacebar is pressed again', () => {
    render(<App />);
    
    // Press once to start listening
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    expect(screen.getByText(/Listening\.\.\./i)).toBeInTheDocument();
    expect(currentMockRecognition?.start).toHaveBeenCalledTimes(1);

    // Press again to stop listening
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    expect(screen.getByText(/WELCOME TO AFIT/i)).toBeInTheDocument();
    expect(currentMockRecognition?.stop).toHaveBeenCalledTimes(1);
  });

  it('verbally confirms destination when a valid transcript is matched', () => {
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak');
    const MockUtterance = vi.fn();
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);

    render(<App />);
    
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    act(() => {
      currentMockRecognition?.simulateResult('where is the library');
    });

    expect(MockUtterance).toHaveBeenCalledWith('Navigating to University Library');
    expect(speakSpy).toHaveBeenCalled();
  });

  it('verbally announces error when an invalid transcript is received', () => {
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak');
    const MockUtterance = vi.fn();
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);

    render(<App />);
    
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    act(() => {
      currentMockRecognition?.simulateResult('gibberish text that matches no location');
    });

    expect(MockUtterance).toHaveBeenCalledWith("Sorry, I didn't catch that location. Please try again.");
    expect(speakSpy).toHaveBeenCalled();
  });

  it('transitions to Result state and displays QR code on valid location match', () => {
    const MockUtterance = vi.fn().mockImplementation(function(this: any, text: string) {
      this.text = text;
    });
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
    
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utt: SpeechSynthesisUtterance) => {
      if (utt.onend) {
        utt.onend(new Event('end') as SpeechSynthesisEvent);
      }
    });

    render(<App />);
    
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    act(() => {
      currentMockRecognition?.simulateResult('where is the library');
    });

    expect(screen.getByText(/Scan to Navigate/i)).toBeInTheDocument();
    
    // Check if SVG is rendered (qrcode.react uses SVG with proper attributes)
    const qrCode = document.querySelector('svg');
    expect(qrCode).toBeInTheDocument();
    // qrcode.react might not have role or title we can easily select by text, so selecting svg is a good proxy.
  });

  it('returns to idle state on invalid location match after voice feedback completes', () => {
    const MockUtterance = vi.fn().mockImplementation(function(this: any, text: string) {
      this.text = text;
    });
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
    
    const speakSpy = vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utt: SpeechSynthesisUtterance) => {
      if (utt.onend) {
        utt.onend(new Event('end') as SpeechSynthesisEvent);
      }
    });

    render(<App />);
    
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    expect(screen.getByText(/Listening\.\.\./i)).toBeInTheDocument();

    act(() => {
      currentMockRecognition?.simulateResult('gibberish text');
    });

    expect(speakSpy).toHaveBeenCalled();
    expect(screen.getByText(/WELCOME TO AFIT/i)).toBeInTheDocument();
  });

  it('returns to Idle state from Result state after 30 seconds of inactivity', () => {
    vi.useFakeTimers();
    const MockUtterance = vi.fn().mockImplementation(function(this: any, text: string) {
      this.text = text;
    });
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
    
    vi.spyOn(window.speechSynthesis, 'speak').mockImplementation((utt: SpeechSynthesisUtterance) => {
      if (utt.onend) {
        utt.onend(new Event('end') as SpeechSynthesisEvent);
      }
    });

    render(<App />);
    
    act(() => {
      fireEvent.keyDown(window, { code: 'Space' });
    });

    act(() => {
      currentMockRecognition?.simulateResult('where is the library');
    });

    expect(screen.getByText(/Scan to Navigate/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.getByText(/WELCOME TO AFIT/i)).toBeInTheDocument();
    
    vi.useRealTimers();
  });
});

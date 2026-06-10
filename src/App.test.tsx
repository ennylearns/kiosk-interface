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
});

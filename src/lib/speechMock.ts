import { vi } from 'vitest';

// Global instance to allow tests to access the mock directly
export let currentMockRecognition: MockSpeechRecognition | null = null;

export class MockSpeechRecognition {
  constructor() {
    currentMockRecognition = this;
  }

  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: (() => void) | null = null;
  onspeechend: (() => void) | null = null;

  // Utility to simulate speech result
  simulateResult(transcript: string) {
    if (this.onresult) {
      this.onresult({
        results: [
          [{ transcript }]
        ]
      });
    }
  }

  // Utility to simulate error
  simulateError(error: string) {
    if (this.onerror) {
      this.onerror({ error });
    }
  }
}

export const setupSpeechMock = () => {
  (window as any).SpeechRecognition = MockSpeechRecognition;
  (window as any).webkitSpeechRecognition = MockSpeechRecognition;
};

export const teardownSpeechMock = () => {
  delete (window as any).SpeechRecognition;
  delete (window as any).webkitSpeechRecognition;
  currentMockRecognition = null;
};

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

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

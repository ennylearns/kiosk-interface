# Voice-Activated Campus Guide Kiosk

This repository contains the source code for the **Kiosk Interface** component of the Smart Voice-Activated Campus Guide. It is a React-based front-end application designed to run on a physical kiosk (specifically a Kickpi K2B running Chromium in `--kiosk` mode) located at the campus entrance. 

## 🎯 Project Overview

Traditional campus navigation systems can be expensive and difficult to maintain. This solution provides visitors with a seamless, hands-free, accessible way to find their destination. 

Visitors walk up to the non-touch display, press a physical hardware button, and speak their destination naturally (e.g., "Where is the library?"). The application leverages the browser's native **Web Speech API** to interpret the query, matches it against a local location registry, and generates a high-contrast QR code. When scanned, this QR code deep-links the visitor's mobile device to the mobile PWA for turn-by-turn routing.

## 🛠 Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite
- **Speech Processing:** Web Speech API (`window.SpeechRecognition` & `window.speechSynthesis`)
- **QR Generation:** `qrcode.react` (SVG-based)
- **Testing:** Vitest + React Testing Library

## 🏛 Architecture & State Machine

The interface operates strictly through a deterministic state machine, optimized for an unattended kiosk environment:

1. **`idle`**: High-contrast, sun-readable screen inviting the user to interact.
2. **`listening`**: Triggered by a GPIO hardware button (mapped to the `Spacebar` for local development). Displays a visual waveform to indicate active microphone capture.
3. **`result`**: Displays a large SVG-based QR code linking to the campus map software (`https://map.afit.edu/?to=[location_id]`). A built-in timeout automatically reverts the UI back to `idle` after 30 seconds of inactivity to prepare for the next visitor.

### Core Modules

- **`App.tsx`**: The main controller managing the React state machine, hardware events, and Speech API lifecycle.
- **`lib/locationParser.ts`**: A set of pure, heavily unit-tested functions responsible for fuzzy-matching and mapping raw speech transcripts to normalized `locationId`s based on predefined aliases and keywords.
- **`data/locations.json`**: The central data dictionary containing all mappable campus entities, their coordinates, and spoken keywords.
- **`lib/speechMock.ts`**: Utilities for stubbing the native `window.SpeechRecognition` APIs, allowing for rigorous testing of the voice interface in CI/CD environments where audio hardware is unavailable.

## 🧪 Testing Approach

The project adheres to a strict Test-Driven Development (TDD) workflow. Because the target environment relies on hardware peripherals (physical buttons, microphones), testing focuses heavily on deterministic simulation:

- **Speech API Mocking:** We mock `window.SpeechRecognition` and `window.speechSynthesis` to simulate incoming text transcripts and verify state transitions and voice feedback (e.g., "Navigating to the Library").
- **Pure Function Isolation:** The keyword parser (`locationParser.ts`) is isolated and tested against extensive phonetic variations, typos, and edge cases.
- **DOM & Event Simulation:** React Testing Library is used to simulate keyboard events (simulating the physical push-button) and assert correct DOM rendering across state transitions.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation
```bash
npm install
```

### Running Locally
To start the Vite development server:
```bash
npm run dev
```
> **Note:** To trigger the kiosk listening state during local development, press the **Spacebar**.

### Running Tests
The test suite is powered by Vitest. To run tests in watch mode:
```bash
npm test
```
To run tests once for CI:
```bash
npm run test run
```

## 🔌 Hardware Target Details

- **Display:** 720p non-touch monitor.
- **Compute:** Kickpi K2B running Chromium.
- **Input:** Single GPIO push-button.
- **Network:** Requires an active internet connection for the Web Speech API to function. Offline states must be handled gracefully.

# PRD: Kiosk Interface

## Problem Statement

Traditional campus navigation systems (like mobile guide robots) are expensive and difficult to maintain. To provide an accessible and modern experience, the project requires a static, interactive kiosk located at the school entrance. While the mobile navigation PWA is already functional and capable of routing via deep links, the physical kiosk interface is currently missing. Visitors need a seamless, hands-free way to interact with the kiosk to generate a mobile navigation link to their desired campus building.

## Solution

A fullscreen, voice-activated React application intended to run on a Raspberry Pi via Chromium in `--kiosk` mode. The interface will idle until activated by a physical push button. It will utilize the Web Speech API to listen to user queries, parse the destination against a local `locations.json` database, and use `qrcode.react` to display a high-contrast QR code. Scanning this QR code will deep-link the user to the mobile PWA with their destination pre-selected for turn-by-turn routing.

## User Stories

1. As a campus visitor, I want to see a welcoming idle screen with a visual prompt, so that I know the kiosk is ready for interaction.
2. As a campus visitor, I want to activate the kiosk by pressing a physical push button, so that I can initiate my query.
3. As a user, I want to see a visual indication (such as a waveform) when speaking, so that I have feedback that the system is actively listening.
4. As a user, I want to state my destination in natural language (e.g., "Where is the main library?"), so that I don't have to navigate complex menus.
5. As a system operator, I want the application to parse spoken text for keywords and match them against `locations.json`, so that variations in speech correctly map to the intended destination ID.
6. As a user, I want the kiosk to verbally confirm my destination or inform me if it didn't understand the location, so that I receive immediate, clear feedback.
7. As a user, I want the kiosk to generate and display a high-contrast QR code, so that my mobile phone immediately opens the campus map with my route loaded when scanned.
8. As a system operator, I want the kiosk to gracefully handle offline status (which breaks speech recognition) by displaying an offline error message, since touch-based manual fallback is not possible on the non-touch display.
9. As a system operator, I want the kiosk to automatically return to the Idle state after a period of inactivity, so that it is ready for the next visitor.

## Implementation Decisions

- **Architecture:** The Kiosk Interface will be built as an independent, standalone application (e.g., a React app using Vite) rather than being integrated into the existing `map-pwa` codebase. It will maintain its own copy of the `locations.json` data and styling, keeping the two software systems completely separate.
- **Speech APIs:** The solution relies heavily on the `window.SpeechRecognition` (for voice-to-text) and `window.speechSynthesis` (for voice feedback) APIs.
- **QR Generation:** The pre-installed `qrcode.react` dependency will be used to render the deep links (e.g., `https://domain.com/?to=[location_id]`).
- **Hardware Profile:** The UI must be optimized for Chromium `--kiosk` mode on a Raspberry Pi 720p non-touch display, prioritizing large typography and high-contrast elements.
- **Hardware Input:** The application will listen for a specific keydown event (e.g., Spacebar or a specific key) that maps to the physical GPIO push button connected to the Raspberry Pi to trigger the "wake and speak" functionality.

## Testing Decisions

To ensure the kiosk behaves reliably on physical hardware, we will focus on the following testing seams:

- **Speech API Mocking:** We will not test the browser's speech recognition engine itself. Instead, we will mock `window.SpeechRecognition` and `window.speechSynthesis` to simulate incoming text transcripts and verify that the application transitions state and issues the correct synthesized speech commands.
- **Keyword Parser (Pure Functions):** The logic that matches speech transcripts against the keywords in `locations.json` will be extracted into pure functions. These will be heavily unit-tested against various phrasings, typos, and edge cases to ensure robust location matching.
- **State Machine Transitions:** Testing will cover the complete flow of the UI state machine: `Idle -> Listening -> Processing -> Result (QR Code) -> Timeout -> Idle`.
- **Hardware Button Simulation:** Testing will simulate keyboard events (e.g., Spacebar) to ensure the physical button press correctly transitions the app from Idle to Listening.
- **Offline Detection:** We will simulate `navigator.onLine = false` to verify that the application correctly displays the offline error message.
- **Prior Art:** Standard React Testing Library integration tests will be used to simulate button presses and verify the presence of the QR code in the DOM.

## Out of Scope

- Modifying the mobile turn-by-turn routing logic.
- Adding new campus locations or altering the schema of `locations.json`.
- Hardware integration for the thermal printer (for users without smartphones), as this will be addressed in a separate, later phase.

## Further Notes

- The reliability of the Web Speech API requires an active internet connection. Since there is no touch interface, handling offline states gracefully with clear instructions to the user is critical.
- Micro-animations (e.g., the pulsing idle microphone and the listening waveform) should be implemented using lightweight CSS to ensure smooth performance on the Raspberry Pi.

# Kiosk Interface Issues

Here are the vertical slices broken down into issues. You can copy and paste these into your issue tracker.

---

## Issue 1: Initialize Independent Kiosk App & Idle Screen
**Type:** AFK

### What to build
Scaffold a new, independent React application (e.g., using Vite) for the kiosk interface. Create the base fullscreen layout optimized for a 1080p non-touch screen and implement the initial "Idle" state UI with a welcoming message and a visual prompt.

### Acceptance criteria
- [ ] A new React application is scaffolded independently from the map software.
- [ ] The base layout is fullscreen and optimized for a 1080p non-touch display.
- [ ] The initial "Idle" state UI displays a welcoming message.
- [ ] A visual prompt indicates that the user should press a button to start.

### Blocked by
None - can start immediately

---

## Issue 2: Location Data Setup & Keyword Parser
**Type:** AFK

### What to build
Bring in a copy of the `locations.json` data. Create pure, heavily unit-tested functions to take a raw text transcript and match it against the location keywords. Handle edge cases, typos, and fuzzy matching independently from the map software.

### Acceptance criteria
- [ ] `locations.json` data is accessible within the application.
- [ ] Pure functions for keyword parsing are implemented.
- [ ] Unit tests cover exact matches, typos, and fuzzy matching variations.
- [ ] The parser correctly returns the intended destination ID from the transcript.

### Blocked by
None - can start immediately

---

## Issue 3: Hardware Activation & Mock Listening State
**Type:** AFK

### What to build
Wire up a global keydown listener (e.g., Spacebar) to simulate the GPIO push-button. Build the state transition from 'Idle' to 'Listening', including a visual indicator (CSS-based waveform or pulsing icon). Wire up mocks for the Web Speech API to simulate receiving a text transcript so the state machine can be tested.

### Acceptance criteria
- [ ] A global keydown listener captures the designated activation key (e.g., Spacebar).
- [ ] Pressing the key transitions the UI from the 'Idle' state to a 'Listening' state.
- [ ] The 'Listening' state includes a visual indicator (e.g., waveform).
- [ ] Mocked Web Speech API allows simulating incoming transcripts for testing.

### Blocked by
- Issue 1 (Initialize App)

---

## Issue 4: Speech API Integration & Voice Feedback
**Type:** HITL

### What to build
Swap out the testing mocks for the real `window.SpeechRecognition` API. Feed the recognized transcript to the Keyword Parser. Use `window.speechSynthesis` to verbally confirm the matched destination to the user, or audibly announce an error if the location is not understood.

### Acceptance criteria
- [ ] Real `window.SpeechRecognition` API captures spoken audio and returns a transcript.
- [ ] The parsed transcript successfully determines the destination via the Keyword Parser.
- [ ] `window.speechSynthesis` verbally confirms success (e.g., "Navigating to Main Library").
- [ ] `window.speechSynthesis` verbally announces errors when no location matches.

### Blocked by
- Issue 2 (Keyword Parser)
- Issue 3 (Mock Listening State)

---

## Issue 5: QR Code Generation & Inactivity Timeout
**Type:** AFK

### What to build
On a successful location match, transition the UI to the 'Result' state. Render a high-contrast QR code pointing to the map software (e.g., `https://[map-url]/?to=[id]`) using `qrcode.react`. Implement a timer that automatically resets the kiosk back to the 'Idle' state after a set period of inactivity (e.g., 30 seconds).

### Acceptance criteria
- [ ] Successful matches transition the UI to the 'Result' state.
- [ ] A high-contrast QR code is rendered containing the correct deep-link URL.
- [ ] Scanning the QR code maps correctly to the map software destination.
- [ ] An inactivity timer (e.g., 30s) automatically resets the UI back to the 'Idle' state.

### Blocked by
- Issue 2 (Keyword Parser)
- Issue 3 (Mock Listening State)

---

## Issue 6: Offline Mode Fallback
**Type:** AFK

### What to build
Implement a listener for `navigator.onLine`. If the internet connection drops, aggressively override the UI to show a full-screen offline error message and disable the push-button trigger, as the Web Speech API requires internet access to function.

### Acceptance criteria
- [ ] The application monitors the browser's online/offline status.
- [ ] When offline, a full-screen error message overrides the normal UI.
- [ ] The push-button activation is disabled while offline.
- [ ] Reconnecting to the internet restores normal 'Idle' functionality.

### Blocked by
- Issue 1 (Initialize App)

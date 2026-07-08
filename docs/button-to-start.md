# Product Requirements Document (PRD)

## Project

GPIO Button Integration for Raspberry Pi Kiosk

## Version

1.0

## Author

Eniola Odunaiya

---

# 1. Overview

This feature enables a physical push button connected to a Raspberry Pi 3B+ to interact with the React-based kiosk application in real time.

Instead of users touching the screen immediately, they can press one or more physical buttons to trigger actions such as starting the application, returning to the home screen, navigating between pages, or confirming selections.

The system should provide near-instant response (<100 ms under normal conditions) and continue operating even after unexpected shutdowns or power outages.

---

# 2. Problem Statement

The current kiosk application only accepts on-screen interaction.

The hardware kiosk requires physical push buttons that can trigger actions directly within the React application.

Since React cannot directly access Raspberry Pi GPIO pins, an intermediary service is required to bridge the hardware and the frontend.

---

# 3. Goals

* Read GPIO button presses from the Raspberry Pi.
* Notify the React application in real time.
* Keep hardware logic separate from UI logic.
* Automatically recover after reboot.
* Support future expansion to multiple buttons.

---

# 4. Non-Goals

The first version will not include:

* Analog sensors
* LEDs
* RFID readers
* NFC
* Touchscreen gestures
* Remote GPIO management

These may be added in future releases.

---

# 5. User Stories

### Visitor

As a visitor,

I want to press a physical button,

so that the kiosk immediately begins interacting with me.

---

As a visitor,

I want navigation buttons to respond instantly,

so that using the kiosk feels natural.

---

As an administrator,

I want the system to restart automatically after power loss,

so that no manual intervention is required.

---

# 6. Functional Requirements

## Backend

The backend shall:

* Read GPIO pin states.
* Detect button press and release.
* Debounce button presses.
* Expose a WebSocket server.
* Broadcast button events.
* Continue running after crashes.
* Start automatically during boot.

---

## Frontend

The React application shall:

* Connect to the backend WebSocket.
* Listen continuously for events.
* Execute predefined actions when events are received.
* Automatically reconnect if the WebSocket disconnects.

---

# 7. Event Flow

1. User presses button.
2. GPIO pin changes state.
3. Node.js detects change.
4. Event is created.
5. Event is sent over WebSocket.
6. React receives the event.
7. React performs the assigned action.

---

# 8. Event Specification

## Button Press

```json
{
  "type": "BUTTON_PRESSED",
  "button": "START",
  "timestamp": 1783482345
}
```

---

## Home Button

```json
{
  "type": "HOME"
}
```

---

## Back Button

```json
{
  "type": "BACK"
}
```

---

## Next Button

```json
{
  "type": "NEXT"
}
```

---

## Select Button

```json
{
  "type": "SELECT"
}
```

---

# 9. GPIO Mapping

| GPIO   | Physical Pin | Purpose |
| ------ | ------------ | ------- |
| GPIO17 | Pin 11       | Start   |
| GPIO27 | Pin 13       | Back    |
| GPIO22 | Pin 15       | Next    |
| GPIO23 | Pin 16       | Home    |
| GPIO24 | Pin 18       | Select  |

---

# 10. Technical Architecture

```
Push Button
      │
GPIO Pin
      │
Node.js GPIO Service
      │
WebSocket Server
      │
React Application
      │
Chromium (Kiosk Mode)
      │
Display
```

---

# 11. Technology Stack

## Hardware

* Raspberry Pi 3B+
* Momentary push buttons
* Pull-up configuration
* Jumper wires

## Software

* Raspberry Pi OS Lite (64-bit)
* Node.js
* Express
* WebSocket (ws)
* GPIO library (e.g., onoff, pigpio, or lgpio depending on OS compatibility)
* React
* Chromium
* PM2
* Openbox
* Xorg

---

# 12. Error Handling

If the backend crashes:

* PM2 shall restart it automatically.

If the WebSocket disconnects:

* React shall reconnect automatically.

If a button is held down:

* Only one action should be triggered unless repeat behavior is explicitly enabled.

If GPIO initialization fails:

* Log the error and continue serving the application where possible.

---

# 13. Performance Requirements

* Button response time: less than 100 ms.
* WebSocket latency: less than 50 ms on the local device.
* CPU usage while idle: minimal.
* Memory usage suitable for a Raspberry Pi 3B+ with 1 GB RAM.

---

# 14. Security Requirements

* WebSocket server accepts only local connections.
* No internet exposure is required.
* No user authentication is needed for GPIO events.

---

# 15. Startup Sequence

1. Raspberry Pi boots.
2. Node.js backend starts via PM2.
3. React application is served.
4. Xorg starts.
5. Openbox launches.
6. Chromium opens in kiosk mode.
7. React connects to the WebSocket server.
8. System waits for button input.

---

# 16. Success Metrics

* Button presses are detected reliably.
* Actions are reflected in the UI with minimal delay.
* System recovers automatically after reboot or power loss.
* No manual intervention is required during normal operation.

---

# 17. Future Enhancements

* Rotary encoder support
* LED status indicators
* Buzzer feedback
* RFID/NFC integration
* Emergency stop button
* Hardware diagnostics page
* GPIO configuration dashboard
* Remote monitoring
* Support for additional input devices such as keypads and joysticks

const WebSocket = require('ws');
const readline = require('readline');

const PORT = 8080;
const GPIO_PIN = 17; // Pin 11

const wss = new WebSocket.Server({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

// Function to broadcast to all connected clients
const broadcastPress = () => {
  const message = JSON.stringify({
    type: 'BUTTON_PRESSED',
    button: 'START',
    timestamp: Date.now()
  });
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
  console.log('Broadcasted BUTTON_PRESSED event.');
};

let Gpio;
try {
  Gpio = require('onoff').Gpio;
  // Initialize GPIO 17 as an input, watching for 'falling' edge (button press)
  // Assuming a pull-up resistor is used (either internal or external)
  const button = new Gpio(GPIO_PIN, 'in', 'falling', { debounceTimeout: 100 });
  
  console.log(`Successfully initialized onoff on GPIO ${GPIO_PIN}`);

  button.watch((err, value) => {
    if (err) {
      console.error('Error watching GPIO:', err);
      return;
    }
    console.log('Physical button pressed!');
    broadcastPress();
  });

  // Cleanup on exit
  process.on('SIGINT', _ => {
    button.unexport();
    process.exit();
  });

} catch (err) {
  console.warn(`\n[WARNING] Could not load 'onoff' library. This is expected on Windows/Mac.`);
  console.log(`Falling back to simulation mode.`);
  console.log(`Type 'press' and hit Enter to simulate a button press.\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.on('line', (input) => {
    if (input.trim().toLowerCase() === 'press') {
      console.log('Simulated button pressed!');
      broadcastPress();
    }
  });
}

wss.on('connection', ws => {
  console.log('New client connected.');
  ws.on('close', () => {
    console.log('Client disconnected.');
  });
});

// client.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', () => {
    console.log('Connected to server');

    // Get the list of devices
    ws.send(`JSON${JSON.stringify({ action: 'getDevices' })}`);
});

ws.on('message', (data) => {
    const rawData = data.slice(0, 4).toString();
    if (rawData === 'JSON') {
        const message = JSON.parse(data.slice(4).toString());

        if (message.devices) {
            const devices = message.devices;
            console.log('Available devices:', devices);

            // Select a device for mirroring
            const deviceId = devices[0].id;

            // Start screen mirroring
            ws.send(`JSON${JSON.stringify({ action: 'startMirroring', deviceId })}`);
        }    
    } else {
        // Handle screen mirroring data chunk
        const chunk = data.slice(4);
        // Handle binary screen mirroring data
        console.log('Received screen mirroring data chunk:', chunk);
    }
});

ws.on('close', () => {
    console.log('Disconnected from server');
});

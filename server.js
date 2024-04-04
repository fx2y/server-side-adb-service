// server.js
const WebSocket = require('ws');
const adbService = require('./adb-service');
const screenMirroring = require('./screen-mirroring');

const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (message) => {
        const data = message.slice(0, 4).toString();
        if (data === 'JSON') {
            const jsonData = JSON.parse(message.slice(4).toString());
            const { action, deviceId } = jsonData;

            if (action === 'getDevices') {
                const devices = await adbService.getDevices();
                ws.send(`JSON${JSON.stringify({ devices })}`);
            } else if (action === 'startMirroring') {
                screenMirroring.startScreenMirroring(deviceId, ws);
            } else if (action === 'stopMirroring') {
                screenMirroring.stopScreenMirroring(deviceId);
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server started on port 8080');

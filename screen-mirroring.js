const { spawn } = require('child_process');
const adbService = require('./adb-service');

const mirroringProcesses = new Map();

async function startScreenMirroring(deviceId, ws) {
    const device = await adbService.getDeviceProperties(deviceId);
    const deviceIp = device.ip;

    const scrcpy = spawn('scrcpy', [
        '-s', deviceId,
        // `--tcpip=${deviceIp}`,
        '--turn-screen-off',
        '--max-fps=30',
        // '--no-display',
        // '--record=file.mp4'
    ]);

    scrcpy.stdout.on('data', (chunk) => {
        ws.send(chunk, { binary: true });
    });

    scrcpy.stderr.on('data', (data) => {
        console.error(`scrcpy error: ${data}`);
    });

    scrcpy.on('close', (code) => {
        console.log(`scrcpy process exited with code ${code}`);
        mirroringProcesses.delete(deviceId);
    });

    mirroringProcesses.set(deviceId, scrcpy);
}

function stopScreenMirroring(deviceId) {
    const process = mirroringProcesses.get(deviceId);
    if (process) {
        process.kill();
        mirroringProcesses.delete(deviceId);
    }
}

module.exports = {
    startScreenMirroring,
    stopScreenMirroring,
};
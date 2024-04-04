const net = require('net');
const adbService = require('./adb-service');

const server = net.createServer(async (socket) => {
    console.log('Device connected:', socket.remoteAddress);
    const deviceId = socket.remoteAddress;

    try {
        // Get device properties
        const deviceProperties = await adbService.getDeviceProperties(deviceId);
        console.log('Device properties:', deviceProperties);

        // Execute a shell command on the connected device
        const shellCommand = 'ls -l /sdcard';
        const shellOutput = await adbService.executeCommand(deviceId, shellCommand);
        console.log('Shell command output:', shellOutput);

        // Install an APK on the connected device
        // const apkPath = '/path/to/app.apk';
        // await adbService.installApk(deviceId, apkPath);
        // console.log('APK installed successfully');

        // Push a file to the connected device
        // const localFilePath = '/path/to/local/file.txt';
        // const remoteFilePath = '/sdcard/file.txt';
        // await adbService.pushFile(deviceId, localFilePath, remoteFilePath);
        // console.log('File pushed successfully');

        socket.on('data', (data) => {
            // Handle incoming data from the device if needed
            console.log('Received data from device:', data.toString());
        });

        socket.on('close', () => {
            console.log('Device disconnected:', deviceId);
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

server.listen(5555, () => {
    console.log('TCP server listening on port 5555');
});
const adbService = require('./adb-service');
const screenMirroring = require('./screen-mirroring');

async function runDemo() {
    try {
        // Get the list of connected devices
        const devices = await adbService.getDevices();
        console.log('Connected devices:', devices);

        if (devices.length > 0) {
            const deviceId = devices[0].id;

            // Get device properties
            const deviceProperties = await adbService.getDeviceProperties(deviceId);
            console.log('Device properties:', deviceProperties);

            // Execute a shell command on the device
            const result = await adbService.executeCommand(deviceId, 'ls -l /sdcard');
            console.log('Command result:', result);

            // Push a file to the device
            await adbService.pushFile(deviceId, 'file.txt', '/sdcard/file.txt');
            console.log('File pushed successfully');

            // Install an APK on the device
            // await adbService.installApk(deviceId, 'path/to/app.apk');
            // console.log('APK installed successfully');
        } else {
            console.log('No devices connected');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

runDemo();
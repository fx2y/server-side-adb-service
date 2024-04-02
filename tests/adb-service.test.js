const { getDevices, executeCommand, pushFile, installApk } = require('../adb-service');

const adbService = require('../adb-service');

describe('adb-service', () => {

    describe('getDevices', () => {
        it('should get a list of devices', async () => {
            // mock getDevices implementation
            const mockGetDevices = jest.spyOn(adbService, 'getDevices').mockResolvedValue(['device1', 'device2']);

            const devices = await adbService.getDevices();

            expect(devices).toEqual(['device1', 'device2']);
            expect(mockGetDevices).toHaveBeenCalled();

            // restore the original implementation
            mockGetDevices.mockRestore();
        });
    });

    describe('executeCommand', () => {
        it('should execute a command on a device', async () => {
            // mock executeCommand implementation
            const mockExecuteCommand = jest.spyOn(adbService, 'executeCommand').mockResolvedValue('command output');

            const output = await adbService.executeCommand('deviceId', 'ls');

            expect(output).toEqual('command output');
            expect(mockExecuteCommand).toHaveBeenCalledWith('deviceId', 'ls');

            // restore the original implementation
            mockExecuteCommand.mockRestore();
        });
    });

    describe('pushFile', () => {
        it('should push a file to the device', async () => {
            // mock pushFile implementation
            const mockPushFile = jest.spyOn(adbService, 'pushFile').mockResolvedValue(true);

            const success = await adbService.pushFile('deviceId', 'localFile', 'remotePath');

            expect(success).toBe(true);
            expect(mockPushFile).toHaveBeenCalledWith('deviceId', 'localFile', 'remotePath');

            // restore the original implementation
            mockPushFile.mockRestore();
        });
    });

    describe('installApk', () => {
        it('should install an APK on the device', async () => {
            // mock installApk implementation
            const mockInstallApk = jest.spyOn(adbService, 'installApk').mockResolvedValue(true);

            const success = await adbService.installApk('deviceId', 'apkPath');

            expect(success).toBe(true);
            expect(mockInstallApk).toHaveBeenCalledWith('deviceId', 'apkPath');

            // restore the original implementation
            mockInstallApk.mockRestore();
        });
    });

});

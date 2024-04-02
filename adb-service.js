const adb = require('adbkit');

function createAdbClient() {
    const adbServerAddress = process.env.ADB_SERVER_SOCKET;
    if (adbServerAddress) {
        const [protocol, host, port] = adbServerAddress.split(':');
        console.log(`Using ADB server at ${adbServerAddress}`);
        return adb.createClient({ host, port: parseInt(port) });
    } else {
        return adb.createClient();
    }
}

const client = createAdbClient();

async function getDevices() {
    return await client.listDevices();
}

async function executeCommand(deviceId, command) {
    const stream = await client.shell(deviceId, command);
    return new Promise((resolve, reject) => {
        let output = '';
        stream.on('data', (chunk) => {
            output += chunk.toString();
        });
        stream.on('end', () => {
            resolve(output.trim());
        });
        stream.on('error', (error) => {
            reject(error);
        });
    });
}

async function pushFile(deviceId, localPath, remotePath) {
    await client.push(deviceId, localPath, remotePath);
}

async function installApk(deviceId, apkPath) {
    await client.install(deviceId, apkPath);
}

module.exports = {
    getDevices,
    executeCommand,
    pushFile,
    installApk,
};
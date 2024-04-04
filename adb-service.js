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

async function getDeviceProperties(deviceId) {
  try {
    const properties = await client.getProperties(deviceId);
    const model = properties['ro.product.model'];
    const version = properties['ro.build.version.release'];

    const ipAddress = await getDeviceIpAddress(client, deviceId);

    return {
      id: deviceId,
      ip: ipAddress,
      model,
      version,
    };
  } catch (error) {
    console.error('Error retrieving device properties:', error);
    throw error;
  }
}

async function getDeviceIpAddress(client, deviceId) {
  try {
    const stream = await client.shell(deviceId, ['ip', 'addr', 'show', 'wlan0']);
    const output = await streamToString(stream);
    const lines = output.split('\n');
    const ipLine = lines.find((line) => line.includes('inet '));

    if (ipLine) {
      const ipAddress = ipLine.trim().split(' ')[1].split('/')[0];
      return ipAddress;
    }

    return null;
  } catch (error) {
    console.error('Error retrieving device IP address:', error);
    return null;
  }
}

function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

module.exports = {
    getDevices,
    executeCommand,
    pushFile,
    installApk,
    getDeviceProperties
};
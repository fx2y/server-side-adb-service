import { AdbServerNodeTcpConnector } from "@yume-chan/adb-server-node-tcp";
import { AdbServerClient, Adb, AdbReverseNotSupportedError, AdbSubprocessNoneProtocol } from "@yume-chan/adb";
import { AdbScrcpyClient, AdbScrcpyExitedError, AdbScrcpyOptions2_1 } from "@yume-chan/adb-scrcpy";
import { ScrcpyOptions2_1, ScrcpyLogLevel, ScrcpyInstanceId } from '@yume-chan/scrcpy';
import { ReadableStream, Consumable, DecodeUtf8Stream, SplitStringStream, AbortController, WritableStream } from "@yume-chan/stream-extra";
import { BIN, VERSION } from "@yume-chan/fetch-scrcpy-server";
import fs from "fs/promises";

function createAdbClient() {
    const adbServerAddress = process.env.ADB_SERVER_SOCKET;
    if (adbServerAddress) {
        const [protocol, host, port] = adbServerAddress.split(':');
        console.log(`Using ADB server at ${adbServerAddress}`);
        return new AdbServerNodeTcpConnector({
            host: host,
            port: parseInt(port),
        });
    } else {
        return new AdbServerNodeTcpConnector({
            host: '172.25.112.1',
            port: 5037,
        })
    }
}

async function main() {
    const client = new AdbServerClient(createAdbClient());
    const devices = await client.getDevices();
    if (devices.length === 0) {
        console.log('No devices connected');
        return;
    }

    const device = devices[0];
    console.log('Device:', device);

    const transport = await client.createTransport(device);
    const adb = new Adb(transport);

    const server = await fs.readFile(BIN);
    await AdbScrcpyClient.pushServer(
        adb,
        new ReadableStream({
            start(controller) {
                controller.enqueue(new Consumable(server));
                controller.close();
            }
        })
    );

    const opts = new ScrcpyOptions2_1({ audio: false, scid: ScrcpyInstanceId.random(), logLevel: ScrcpyLogLevel.Debug, sendDeviceMeta: false, sendDummyByte: false, tunnelForward: true });
    // opts.value = { scid: opts.scid }
    const options = new AdbScrcpyOptions2_1(opts);
    const sClient = await AdbScrcpyClient.start(adb, '/data/local/tmp/scrcpy-server.jar', VERSION, options);
    // const conn = options.createConnection(adb);
    // await conn.initialize();
    // const pr = await adb.subprocess.spawn("CLASSPATH=/data/local/tmp/scrcpy-server.jar app_process / com.genymobile.scrcpy.Server 2.1");
    // const stre = await conn.getStreams();
    // await pr.stdout.pipeThrough(new DecodeUtf8Stream()).pipeTo(new WritableStream({ write(chunk) { console.log(chunk); } }));
    // await stre.video?.pipeTo(new WritableStream({write(chunk) { console.log(chunk); } }));

    // let connection;
    // let process;
    // let stdout;
    // let streams;
    // try {
    //     try {
    //         connection = options.createConnection(adb);
    //         await connection.initialize();
    //     }
    //     catch (e) {
    //         if (e instanceof AdbReverseNotSupportedError) {
    //             // When reverse tunnel is not supported, try forward tunnel.
    //             options.tunnelForwardOverride = true;
    //             connection = options.createConnection(adb);
    //             await connection.initialize();
    //         }
    //         else {
    //             connection = undefined;
    //             throw e;
    //         }
    //     }

    //     process = await adb.subprocess.spawn([
    //         `CLASSPATH=/data/local/tmp/scrcpy-server.jar`,
    //         'app_process',
    //         '/',
    //         'com.genymobile.scrcpy.Server',
    //         VERSION,
    //     ], {
    //         // protocols: [AdbSubprocessNoneProtocol],
    //     });

    //     stdout = process.stdout
    //         .pipeThrough(new DecodeUtf8Stream())
    //         .pipeThrough(new SplitStringStream("\n"));

    //     const output = []
    //     const abortController = new AbortController();
    //     const pipe = stdout
    //         .pipeTo(new WritableStream({
    //             write(chunk) {
    //                 output.push(chunk);
    //             },
    //         }), {
    //             signal: abortController.signal,
    //             preventCancel: true,
    //         })
    //         .catch(e => {
    //             if (abortController.signal.aborted) {
    //                 console.log('Aborted');
    //                 return;
    //             }
    //             throw e;
    //         });
    //     // streams = await Promise.race([
    //     //     process.exit.then(() => {
    //     //         throw new AdbScrcpyExitedError(output);
    //     //     }),
    //     //     connection.getStreams(),
    //     // ]);
    //     streams = connection.getStreams();
    //     abortController.abort();
    //     await pipe
    //     if (streams.video) {
    //         streams.video.pipeTo(new WritableStream({
    //             write(chunk) {
    //                 console.log('Video:', chunk.byteLength);
    //             }
    //         }));
    //     }
    // }
    // catch (e) {
    //     await process?.kill();
    //     throw e;
    // }
    // finally {
    //     connection?.dispose();
    // }

    sClient.stdout.pipeTo(new WritableStream({
        write(chunk) {
            console.log(chunk.toString());
        }
    }));

    const videoStream = await sClient.videoStream;
    const { metadata, stream: videoStream2 } = await options.parseVideoStreamMetadata(videoStream.stream);

    console.log(metadata);

    const videoPacketStream = videoStream2.pipeThrough(options.createMediaStreamTransformer());

    videoPacketStream.pipeTo(new WritableStream({
        write(chunk) {
            console.log('Video:', chunk.byteLength);
        }
    }));
}

main().catch(console.error);
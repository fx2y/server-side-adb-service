const express = require('express');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use(express.static('public'));

// Start scrcpy in headless mode
const scrcpy = spawn('scrcpy', ['--turn-screen-off', '--max-fps', '30']);

// Use FFmpeg to capture the scrcpy output and generate an HLS stream
const ffmpeg = spawn('ffmpeg', [
  '-f', 'x11grab',
  '-r', '30',
  '-s', '256x144',
  '-i', ':0.0+0,0',
  '-vcodec', 'libx264',
  '-preset', 'ultrafast',
  '-f', 'hls',
  '-hls_time', '2',
  '-hls_list_size', '10',
  '-hls_flags', 'delete_segments',
  '-hls_segment_filename', 'public/segment%03d.ts',
  'public/stream.m3u8'
]);

// Handle the HLS playlist request
app.get('/stream.m3u8', (req, res) => {
  const filePath = path.resolve(__dirname, 'public', 'stream.m3u8');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.error('Error reading playlist:', err);
      res.sendStatus(500);
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'application/vnd.apple.mpegurl'
    });
    res.end(data);
  });
});

// Handle the HLS segment requests
app.get('/segment:segment.ts', (req, res) => {
  const segment = req.params.segment;
  const filePath = path.resolve(__dirname, 'public', `segment${segment}.ts`);
  const fileStream = fs.createReadStream(filePath);
  fileStream.on('error', (err) => {
    console.error(`Error reading segment ${segment}:`, err);
    res.sendStatus(404);
  });
  res.writeHead(200, {
    'Content-Type': 'video/MP2T'
  });
  fileStream.pipe(res);
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Clean up on server close
process.on('SIGINT', () => {
  scrcpy.kill();
  ffmpeg.kill();
  process.exit();
});

import React, { useEffect, useRef } from 'react';
import { WebCodecsDecoder } from '@yume-chan/scrcpy-decoder-webcodecs';
import BigInteger from 'big-integer';

const App = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const socket = new WebSocket('ws://localhost:8080');

    const fetchStream = async () => {
      const response = await fetch('http://localhost:8080');
      const stream = response.body;
      const decoder = new WebCodecsDecoder();
      const writable = new WritableStream({
        write(chunk) {
          const jsonData = JSON.parse(chunk);
          console.log('Received chunk:', jsonData);
        }
      });

      stream.pipeTo(writable);
      container.appendChild(decoder.renderer);
    };

    const stream = new ReadableStream({
      start(controller) {
        socket.addEventListener('message', (event) => {
          controller.enqueue(event.data);
        });
      }
    });
    const decoder = new WebCodecsDecoder();
    const writable = new WritableStream({
      write(chunk) {
        // const jsonData = JSON.parse(chunk);
        // console.log('Received chunk:', chunk);
      }
    });

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const jsonData = JSON.parse(chunk);
        if (jsonData.type === 'data' && !jsonData.data.hasOwnProperty('type')) {
          const maxKey = Math.max(...Object.keys(jsonData.data).map(Number));
          const length = maxKey + 1;
          const uint8Array = new Uint8Array(length);
          for (const [key, value] of Object.entries(jsonData.data)) {
            uint8Array[Number(key)] = value;
          }
          jsonData.data = uint8Array;
        }
        // console.log('Received chunk:', jsonData);
        controller.enqueue(jsonData);
      }
    });

    stream.pipeThrough(transformStream).pipeTo(decoder.writable);
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(decoder.renderer);
  }, []);

  return (
    <div ref={containerRef} style={{ width: 1080, height: 2160 }} />
  )
};

const reviver = (key, value) => {
  if (typeof value === 'string' && /^[0-9]+n$/.test(value)) {
    return BigInteger(value.slice(0, -1));
  }
  return value;
};

export default App;

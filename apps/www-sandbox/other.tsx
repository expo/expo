'use webview';

import React, { useEffect } from 'react';
// import { Image, View, Text } from 'react-native';
// import { AArrowDown } from 'lucide-react';

export default function App() {
  // useEffect(() => {
  //   // create script and add to body
  //   const s = document.createElement('script');
  //   s.src = 'https://unpkg.com/easymde/dist/easymde.min.js';
  //   document.body.appendChild(s);

  //   const easyMDE = new EasyMDE();
  // }, []);
  const ref = React.useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw math function
    const width = canvas.width;
    const height = canvas.height;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    for (let x = 0; x < width; x++) {
      ctx.lineTo(x, height / 2 - Math.sin(x / 10) * 10);
    }
    ctx.stroke();
  }, [ref]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        backgroundColor: 'darkteal',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {/* <AArrowDown /> */}
      {/* <p>Other</p> */}
      <canvas
        ref={ref}
        id="canvas"
        width="200"
        height="200"
        style={{ backgroundColor: 'orange' }}
      />

      {/* <Image
        source={require('expo-router/assets/error.png')}
        style={{ width: 100, height: 100, backgroundColor: 'orange' }}
      /> */}
    </div>
  );
}

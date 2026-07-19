import Expo2DContext from 'expo-2d-context';

import GLWrap from './GLWrap';

export default GLWrap('Canvas example - expo-2d-context', async (gl) => {
  const ctx = new Expo2DContext(gl);
  ctx.translate(50, 200);
  ctx.scale(4, 4);
  ctx.fillStyle = 'grey';
  ctx.fillRect(20, 40, 100, 100);
  ctx.fillStyle = 'white';
  ctx.fillRect(30, 100, 20, 30);
  ctx.fillRect(60, 100, 20, 30);
  ctx.fillRect(90, 100, 20, 30);
  ctx.beginPath();
  ctx.arc(50, 70, 18, 0, 2 * Math.PI);
  ctx.arc(90, 70, 18, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = 'grey';
  ctx.beginPath();
  ctx.arc(50, 70, 8, 0, 2 * Math.PI);
  ctx.arc(90, 70, 8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = 'black';
  ctx.beginPath();
  ctx.moveTo(70, 40);
  ctx.lineTo(70, 30);
  ctx.arc(70, 20, 10, 0.5 * Math.PI, 2.5 * Math.PI);
  ctx.stroke();
  ctx.flush();
});

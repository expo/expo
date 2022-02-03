import './BeforePIXI';

import * as PIXI from 'pixi.js';
import { Dimensions } from 'react-native';

import GLWrap from './GLWrap';

export default GLWrap('Basic pixi.js use', async (gl) => {
  const { scale: resolution } = Dimensions.get('window');
  const width = gl.drawingBufferWidth / resolution;
  const height = gl.drawingBufferHeight / resolution;
  const app = new PIXI.Application({
    context: gl,
    width,
    height,
    resolution,
    backgroundColor: 0xffffff,
  });
  app.ticker.add(() => gl.endFrameEXP());

  const graphics = new PIXI.Graphics();
  graphics.lineStyle(0);
  graphics.beginFill(0x00ff00);
  graphics.drawCircle(width / 2, height / 2, 50);
  graphics.endFill();
  app.stage.addChild(graphics);
});

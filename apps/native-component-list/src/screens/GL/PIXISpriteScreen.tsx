import './BeforePIXI';

import { Asset } from 'expo-asset';
import { Platform } from 'expo-modules-core';
import * as PIXI from 'pixi.js';
import { Dimensions } from 'react-native';

import GLWrap from './GLWrap';

export default GLWrap('pixi.js sprite rendering', async (gl) => {
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

  const asset = Asset.fromModule(require('../../../assets/images/nikki.png'));
  await asset.downloadAsync();
  let image;
  if (Platform.OS === 'web') {
    image = new Image();
    image.src = asset.localUri!;
  } else {
    image = new Image(asset as any);
  }
  const sprite = PIXI.Sprite.from(image);
  app.stage.addChild(sprite);
});

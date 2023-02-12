/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import GestureHandler, { HammerInputExt } from './GestureHandler';
import { PixelRatio } from 'react-native';

abstract class DraggingGestureHandler extends GestureHandler {
  get shouldEnableGestureOnSetup() {
    return true;
  }

  transformNativeEvent({
    deltaX,
    deltaY,
    velocityX,
    velocityY,
    center: { x, y },
  }: HammerInputExt) {
    // @ts-ignore FIXME(TS)
    const rect = this.view!.getBoundingClientRect();
    const ratio = PixelRatio.get();
    return {
      translationX: deltaX - (this.__initialX || 0),
      translationY: deltaY - (this.__initialY || 0),
      absoluteX: x,
      absoluteY: y,
      velocityX: velocityX * ratio,
      velocityY: velocityY * ratio,
      x: x - rect.left,
      y: y - rect.top,
    };
  }
}

export default DraggingGestureHandler;

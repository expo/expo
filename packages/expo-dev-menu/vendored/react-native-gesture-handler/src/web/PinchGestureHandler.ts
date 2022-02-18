import Hammer from '@egjs/hammerjs';
import { HammerInputExt } from './GestureHandler';

import IndiscreteGestureHandler from './IndiscreteGestureHandler';

class PinchGestureHandler extends IndiscreteGestureHandler {
  get name() {
    return 'pinch';
  }

  get NativeGestureClass() {
    return Hammer.Pinch;
  }

  transformNativeEvent({ scale, velocity, center }: HammerInputExt) {
    return {
      focalX: center.x,
      focalY: center.y,
      velocity,
      scale,
    };
  }
}

export default PinchGestureHandler;

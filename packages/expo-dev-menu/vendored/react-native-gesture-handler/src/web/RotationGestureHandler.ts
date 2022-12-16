import Hammer from '@egjs/hammerjs';

import { DEG_RAD } from './constants';
import { HammerInputExt } from './GestureHandler';
import IndiscreteGestureHandler from './IndiscreteGestureHandler';

class RotationGestureHandler extends IndiscreteGestureHandler {
  get name() {
    return 'rotate';
  }

  get NativeGestureClass() {
    return Hammer.Rotate;
  }

  transformNativeEvent({ rotation, velocity, center }: HammerInputExt) {
    return {
      rotation: (rotation - (this.initialRotation ?? 0)) * DEG_RAD,
      anchorX: center.x,
      anchorY: center.y,
      velocity,
    };
  }
}
export default RotationGestureHandler;

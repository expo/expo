/* eslint-disable eslint-comments/no-unlimited-disable */
/* eslint-disable */
import GestureHandler from './GestureHandler';
import { TEST_MAX_IF_NOT_NAN } from './utils';

abstract class DiscreteGestureHandler extends GestureHandler {
  get isDiscrete() {
    return true;
  }

  get shouldEnableGestureOnSetup() {
    return true;
  }

  shouldFailUnderCustomCriteria(
    { x, y, deltaX, deltaY }: any,
    { maxDeltaX, maxDeltaY, maxDistSq, shouldCancelWhenOutside }: any
  ) {
    if (shouldCancelWhenOutside) {
      if (!this.isPointInView({ x, y })) {
        return true;
      }
    }
    return (
      TEST_MAX_IF_NOT_NAN(Math.abs(deltaX), maxDeltaX) ||
      TEST_MAX_IF_NOT_NAN(Math.abs(deltaY), maxDeltaY) ||
      TEST_MAX_IF_NOT_NAN(
        Math.abs(deltaY * deltaY + deltaX * deltaX),
        maxDistSq
      )
    );
  }

  transformNativeEvent({ center: { x, y } }: any) {
    // @ts-ignore FIXME(TS)
    const rect = this.view!.getBoundingClientRect();

    return {
      absoluteX: x,
      absoluteY: y,
      x: x - rect.left,
      y: y - rect.top,
    };
  }

  isGestureEnabledForEvent(
    {
      minPointers,
      maxPointers,
      maxDeltaX,
      maxDeltaY,
      maxDistSq,
      shouldCancelWhenOutside,
    }: any,
    _recognizer: any,
    { maxPointers: pointerLength, center, deltaX, deltaY }: any
  ) {
    const validPointerCount =
      pointerLength >= minPointers && pointerLength <= maxPointers;

    if (
      this.shouldFailUnderCustomCriteria(
        { ...center, deltaX, deltaY },
        {
          maxDeltaX,
          maxDeltaY,
          maxDistSq,
          shouldCancelWhenOutside,
        }
      ) ||
      // A user probably won't land a multi-pointer tap on the first tick (so we cannot just cancel each time)
      // but if the gesture is running and the user adds or subtracts another pointer then it should fail.
      (!validPointerCount && this.isGestureRunning)
    ) {
      return { failed: true };
    }

    return { success: validPointerCount };
  }
}

export default DiscreteGestureHandler;

import GestureHandler from './GestureHandler';

/**
 * The base class for **Rotation** and **Pinch** gesture handlers.
 */
abstract class IndiscreteGestureHandler extends GestureHandler {
  get shouldEnableGestureOnSetup() {
    return false;
  }

  updateGestureConfig({ minPointers = 2, maxPointers = 2, ...props }) {
    return super.updateGestureConfig({
      minPointers,
      maxPointers,
      ...props,
    });
  }

  isGestureEnabledForEvent(
    { minPointers, maxPointers }: any,
    _recognizer: any,
    { maxPointers: pointerLength }: any
  ) {
    if (pointerLength > maxPointers) {
      return { failed: true };
    }
    const validPointerCount = pointerLength >= minPointers;
    return {
      success: validPointerCount,
    };
  }
}
export default IndiscreteGestureHandler;

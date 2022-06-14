import createHandler from './createHandler';
import {
  BaseGestureHandlerProps,
  baseGestureHandlerProps,
} from './gestureHandlerCommon';

export type RotationGestureHandlerEventPayload = {
  /**
   * Amount rotated, expressed in radians, from the gesture's focal point
   * (anchor).
   */
  rotation: number;

  /**
   * X coordinate, expressed in points, of the gesture's central focal point
   * (anchor).
   */
  anchorX: number;

  /**
   * Y coordinate, expressed in points, of the gesture's central focal point
   * (anchor).
   */
  anchorY: number;

  /**
   *
   * Instantaneous velocity, expressed in point units per second, of the
   * gesture.
   */
  velocity: number;
};

export interface RotationGestureHandlerProps
  extends BaseGestureHandlerProps<RotationGestureHandlerEventPayload> {}

export type RotationGestureHandler = typeof RotationGestureHandler;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const RotationGestureHandler = createHandler<
  RotationGestureHandlerProps,
  RotationGestureHandlerEventPayload
>({
  name: 'RotationGestureHandler',
  allowedProps: baseGestureHandlerProps,
  config: {},
});

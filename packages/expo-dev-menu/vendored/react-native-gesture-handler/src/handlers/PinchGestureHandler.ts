import createHandler from './createHandler';
import {
  BaseGestureHandlerProps,
  baseGestureHandlerProps,
} from './gestureHandlerCommon';

export type PinchGestureHandlerEventPayload = {
  /**
   * The scale factor relative to the points of the two touches in screen
   * coordinates.
   */
  scale: number;

  /**
   * Position expressed in points along X axis of center anchor point of
   * gesture.
   */
  focalX: number;

  /**
   * Position expressed in points along Y axis of center anchor point of
   * gesture.
   */
  focalY: number;

  /**
   *
   * Velocity of the pan gesture the current moment. The value is expressed in
   * point units per second.
   */
  velocity: number;
};

export interface PinchGestureHandlerProps
  extends BaseGestureHandlerProps<PinchGestureHandlerEventPayload> {}

export type PinchGestureHandler = typeof PinchGestureHandler;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const PinchGestureHandler = createHandler<
  PinchGestureHandlerProps,
  PinchGestureHandlerEventPayload
>({
  name: 'PinchGestureHandler',
  allowedProps: baseGestureHandlerProps,
  config: {},
});

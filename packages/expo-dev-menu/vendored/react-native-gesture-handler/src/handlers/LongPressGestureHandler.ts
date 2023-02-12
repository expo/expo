import createHandler from './createHandler';
import {
  BaseGestureHandlerProps,
  baseGestureHandlerProps,
} from './gestureHandlerCommon';

export const longPressGestureHandlerProps = [
  'minDurationMs',
  'maxDist',
] as const;

export type LongPressGestureHandlerEventPayload = {
  /**
   * X coordinate, expressed in points, of the current position of the pointer
   * (finger or a leading pointer when there are multiple fingers placed)
   * relative to the view attached to the handler.
   */
  x: number;

  /**
   * Y coordinate, expressed in points, of the current position of the pointer
   * (finger or a leading pointer when there are multiple fingers placed)
   * relative to the view attached to the handler.
   */
  y: number;

  /**
   * X coordinate, expressed in points, of the current position of the pointer
   * (finger or a leading pointer when there are multiple fingers placed)
   * relative to the root view. It is recommended to use `absoluteX` instead of
   * `x` in cases when the view attached to the handler can be transformed as an
   * effect of the gesture.
   */
  absoluteX: number;

  /**
   * Y coordinate, expressed in points, of the current position of the pointer
   * (finger or a leading pointer when there are multiple fingers placed)
   * relative to the root view. It is recommended to use `absoluteY` instead of
   * `y` in cases when the view attached to the handler can be transformed as an
   * effect of the gesture.
   */
  absoluteY: number;

  /**
   * Duration of the long press (time since the start of the event), expressed
   * in milliseconds.
   */
  duration: number;
};

export interface LongPressGestureConfig {
  /**
   * Minimum time, expressed in milliseconds, that a finger must remain pressed on
   * the corresponding view. The default value is 500.
   */
  minDurationMs?: number;

  /**
   * Maximum distance, expressed in points, that defines how far the finger is
   * allowed to travel during a long press gesture. If the finger travels
   * further than the defined distance and the handler hasn't yet activated, it
   * will fail to recognize the gesture. The default value is 10.
   */
  maxDist?: number;
}

export interface LongPressGestureHandlerProps
  extends BaseGestureHandlerProps<LongPressGestureHandlerEventPayload>,
    LongPressGestureConfig {}

export type LongPressGestureHandler = typeof LongPressGestureHandler;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const LongPressGestureHandler = createHandler<
  LongPressGestureHandlerProps,
  LongPressGestureHandlerEventPayload
>({
  name: 'LongPressGestureHandler',
  allowedProps: [
    ...baseGestureHandlerProps,
    ...longPressGestureHandlerProps,
  ] as const,
  config: {},
});

import createHandler from './createHandler';
import {
  BaseGestureHandlerProps,
  baseGestureHandlerProps,
} from './gestureHandlerCommon';

export const nativeViewGestureHandlerProps = [
  'shouldActivateOnStart',
  'disallowInterruption',
] as const;

export interface NativeViewGestureConfig {
  /**
   * Android only.
   *
   * Determines whether the handler should check for an existing touch event on
   * instantiation.
   */
  shouldActivateOnStart?: boolean;

  /**
   * When `true`, cancels all other gesture handlers when this
   * `NativeViewGestureHandler` receives an `ACTIVE` state event.
   */
  disallowInterruption?: boolean;
}

export interface NativeViewGestureHandlerProps
  extends BaseGestureHandlerProps<NativeViewGestureHandlerPayload>,
    NativeViewGestureConfig {}

export type NativeViewGestureHandlerPayload = {
  /**
   * True if gesture was performed inside of containing view, false otherwise.
   */
  pointerInside: boolean;
};

export const nativeViewProps = [
  ...baseGestureHandlerProps,
  ...nativeViewGestureHandlerProps,
] as const;

export type NativeViewGestureHandler = typeof NativeViewGestureHandler;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const NativeViewGestureHandler = createHandler<
  NativeViewGestureHandlerProps,
  NativeViewGestureHandlerPayload
>({
  name: 'NativeViewGestureHandler',
  allowedProps: nativeViewProps,
  config: {},
});

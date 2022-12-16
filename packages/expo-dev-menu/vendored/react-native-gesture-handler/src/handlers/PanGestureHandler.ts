import createHandler from './createHandler';
import {
  BaseGestureHandlerProps,
  baseGestureHandlerProps,
} from './gestureHandlerCommon';

export const panGestureHandlerProps = [
  'activeOffsetY',
  'activeOffsetX',
  'failOffsetY',
  'failOffsetX',
  'minDist',
  'minVelocity',
  'minVelocityX',
  'minVelocityY',
  'minPointers',
  'maxPointers',
  'avgTouches',
  'enableTrackpadTwoFingerGesture',
] as const;

export const panGestureHandlerCustomNativeProps = [
  'activeOffsetYStart',
  'activeOffsetYEnd',
  'activeOffsetXStart',
  'activeOffsetXEnd',
  'failOffsetYStart',
  'failOffsetYEnd',
  'failOffsetXStart',
  'failOffsetXEnd',
] as const;

export type PanGestureHandlerEventPayload = {
  /**
   * X coordinate of the current position of the pointer (finger or a leading
   * pointer when there are multiple fingers placed) relative to the view
   * attached to the handler. Expressed in point units.
   */
  x: number;

  /**
   * Y coordinate of the current position of the pointer (finger or a leading
   * pointer when there are multiple fingers placed) relative to the view
   * attached to the handler. Expressed in point units.
   */
  y: number;

  /**
   * X coordinate of the current position of the pointer (finger or a leading
   * pointer when there are multiple fingers placed) relative to the root view.
   * The value is expressed in point units. It is recommended to use it instead
   * of `x` in cases when the original view can be transformed as an effect of
   * the gesture.
   */
  absoluteX: number;

  /**
   * Y coordinate of the current position of the pointer (finger or a leading
   * pointer when there are multiple fingers placed) relative to the root view.
   * The value is expressed in point units. It is recommended to use it instead
   * of `y` in cases when the original view can be transformed as an
   * effect of the gesture.
   */
  absoluteY: number;

  /**
   * Translation of the pan gesture along X axis accumulated over the time of
   * the gesture. The value is expressed in the point units.
   */
  translationX: number;

  /**
   * Translation of the pan gesture along Y axis accumulated over the time of
   * the gesture. The value is expressed in the point units.
   */
  translationY: number;

  /**
   * Velocity of the pan gesture along the X axis in the current moment. The
   * value is expressed in point units per second.
   */
  velocityX: number;

  /**
   * Velocity of the pan gesture along the Y axis in the current moment. The
   * value is expressed in point units per second.
   */
  velocityY: number;
};

interface CommonPanProperties {
  /**
   * Minimum distance the finger (or multiple finger) need to travel before the
   * handler activates. Expressed in points.
   */
  minDist?: number;

  /**
   * Android only.
   */
  avgTouches?: boolean;

  /**
   * Enables two-finger gestures on supported devices, for example iPads with
   * trackpads. If not enabled the gesture will require click + drag, with
   * enableTrackpadTwoFingerGesture swiping with two fingers will also trigger
   * the gesture.
   */
  enableTrackpadTwoFingerGesture?: boolean;

  /**
   * A number of fingers that is required to be placed before handler can
   * activate. Should be a higher or equal to 0 integer.
   */
  minPointers?: number;

  /**
   * When the given number of fingers is placed on the screen and handler hasn't
   * yet activated it will fail recognizing the gesture. Should be a higher or
   * equal to 0 integer.
   */
  maxPointers?: number;

  minVelocity?: number;
  minVelocityX?: number;
  minVelocityY?: number;
}

export interface PanGestureConfig extends CommonPanProperties {
  activeOffsetYStart?: number;
  activeOffsetYEnd?: number;
  activeOffsetXStart?: number;
  activeOffsetXEnd?: number;
  failOffsetYStart?: number;
  failOffsetYEnd?: number;
  failOffsetXStart?: number;
  failOffsetXEnd?: number;
}

export interface PanGestureHandlerProps
  extends BaseGestureHandlerProps<PanGestureHandlerEventPayload>,
    CommonPanProperties {
  /**
   * Range along X axis (in points) where fingers travels without activation of
   * handler. Moving outside of this range implies activation of handler. Range
   * can be given as an array or a single number. If range is set as an array,
   * first value must be lower or equal to 0, a the second one higher or equal
   * to 0. If only one number `p` is given a range of `(-inf, p)` will be used
   * if `p` is higher or equal to 0 and `(-p, inf)` otherwise.
   */
  activeOffsetY?: number | number[];

  /**
   * Range along X axis (in points) where fingers travels without activation of
   * handler. Moving outside of this range implies activation of handler. Range
   * can be given as an array or a single number. If range is set as an array,
   * first value must be lower or equal to 0, a the second one higher or equal
   * to 0. If only one number `p` is given a range of `(-inf, p)` will be used
   * if `p` is higher or equal to 0 and `(-p, inf)` otherwise.
   */
  activeOffsetX?: number | number[];

  /**
   * When the finger moves outside this range (in points) along Y axis and
   * handler hasn't yet activated it will fail recognizing the gesture. Range
   * can be given as an array or a single number. If range is set as an array,
   * first value must be lower or equal to 0, a the second one higher or equal
   * to 0. If only one number `p` is given a range of `(-inf, p)` will be used
   * if `p` is higher or equal to 0 and `(-p, inf)` otherwise.
   */
  failOffsetY?: number | number[];

  /**
   * When the finger moves outside this range (in points) along X axis and
   * handler hasn't yet activated it will fail recognizing the gesture. Range
   * can be given as an array or a single number. If range is set as an array,
   * first value must be lower or equal to 0, a the second one higher or equal
   * to 0. If only one number `p` is given a range of `(-inf, p)` will be used
   * if `p` is higher or equal to 0 and `(-p, inf)` otherwise.
   */
  failOffsetX?: number | number[];
}

export type PanGestureHandler = typeof PanGestureHandler;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const PanGestureHandler = createHandler<
  PanGestureHandlerProps,
  PanGestureHandlerEventPayload
>({
  name: 'PanGestureHandler',
  allowedProps: [
    ...baseGestureHandlerProps,
    ...panGestureHandlerProps,
  ] as const,
  config: {},
  transformProps: managePanProps,
  customNativeProps: panGestureHandlerCustomNativeProps,
});

function validatePanGestureHandlerProps(props: PanGestureHandlerProps) {
  if (
    Array.isArray(props.activeOffsetX) &&
    (props.activeOffsetX[0] > 0 || props.activeOffsetX[1] < 0)
  ) {
    throw new Error(
      `First element of activeOffsetX should be negative, a the second one should be positive`
    );
  }

  if (
    Array.isArray(props.activeOffsetY) &&
    (props.activeOffsetY[0] > 0 || props.activeOffsetY[1] < 0)
  ) {
    throw new Error(
      `First element of activeOffsetY should be negative, a the second one should be positive`
    );
  }

  if (
    Array.isArray(props.failOffsetX) &&
    (props.failOffsetX[0] > 0 || props.failOffsetX[1] < 0)
  ) {
    throw new Error(
      `First element of failOffsetX should be negative, a the second one should be positive`
    );
  }

  if (
    Array.isArray(props.failOffsetY) &&
    (props.failOffsetY[0] > 0 || props.failOffsetY[1] < 0)
  ) {
    throw new Error(
      `First element of failOffsetY should be negative, a the second one should be positive`
    );
  }

  if (props.minDist && (props.failOffsetX || props.failOffsetY)) {
    throw new Error(
      `It is not supported to use minDist with failOffsetX or failOffsetY, use activeOffsetX and activeOffsetY instead`
    );
  }

  if (props.minDist && (props.activeOffsetX || props.activeOffsetY)) {
    throw new Error(
      `It is not supported to use minDist with activeOffsetX or activeOffsetY`
    );
  }
}

function transformPanGestureHandlerProps(props: PanGestureHandlerProps) {
  type InternalPanGHKeys =
    | 'activeOffsetXStart'
    | 'activeOffsetXEnd'
    | 'failOffsetXStart'
    | 'failOffsetXEnd'
    | 'activeOffsetYStart'
    | 'activeOffsetYEnd'
    | 'failOffsetYStart'
    | 'failOffsetYEnd';
  type PanGestureHandlerInternalProps = PanGestureHandlerProps &
    Partial<Record<InternalPanGHKeys, number>>;

  const res: PanGestureHandlerInternalProps = { ...props };

  if (props.activeOffsetX !== undefined) {
    delete res.activeOffsetX;
    if (Array.isArray(props.activeOffsetX)) {
      res.activeOffsetXStart = props.activeOffsetX[0];
      res.activeOffsetXEnd = props.activeOffsetX[1];
    } else if (props.activeOffsetX < 0) {
      res.activeOffsetXStart = props.activeOffsetX;
    } else {
      res.activeOffsetXEnd = props.activeOffsetX;
    }
  }

  if (props.activeOffsetY !== undefined) {
    delete res.activeOffsetY;
    if (Array.isArray(props.activeOffsetY)) {
      res.activeOffsetYStart = props.activeOffsetY[0];
      res.activeOffsetYEnd = props.activeOffsetY[1];
    } else if (props.activeOffsetY < 0) {
      res.activeOffsetYStart = props.activeOffsetY;
    } else {
      res.activeOffsetYEnd = props.activeOffsetY;
    }
  }

  if (props.failOffsetX !== undefined) {
    delete res.failOffsetX;
    if (Array.isArray(props.failOffsetX)) {
      res.failOffsetXStart = props.failOffsetX[0];
      res.failOffsetXEnd = props.failOffsetX[1];
    } else if (props.failOffsetX < 0) {
      res.failOffsetXStart = props.failOffsetX;
    } else {
      res.failOffsetXEnd = props.failOffsetX;
    }
  }

  if (props.failOffsetY !== undefined) {
    delete res.failOffsetY;
    if (Array.isArray(props.failOffsetY)) {
      res.failOffsetYStart = props.failOffsetY[0];
      res.failOffsetYEnd = props.failOffsetY[1];
    } else if (props.failOffsetY < 0) {
      res.failOffsetYStart = props.failOffsetY;
    } else {
      res.failOffsetYEnd = props.failOffsetY;
    }
  }

  return res;
}

export function managePanProps(props: PanGestureHandlerProps) {
  if (__DEV__) {
    validatePanGestureHandlerProps(props);
  }
  return transformPanGestureHandlerProps(props);
}

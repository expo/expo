import React from 'react';
import PlatformConstants from '../PlatformConstants';
import createHandler from './createHandler';
import {
  BaseGestureHandlerProps,
  baseGestureHandlerProps,
} from './gestureHandlerCommon';

export const forceTouchGestureHandlerProps = [
  'minForce',
  'maxForce',
  'feedbackOnActivation',
] as const;

class ForceTouchFallback extends React.Component {
  static forceTouchAvailable = false;
  componentDidMount() {
    console.warn(
      'ForceTouchGestureHandler is not available on this platform. Please use ForceTouchGestureHandler.forceTouchAvailable to conditionally render other components that would provide a fallback behavior specific to your usecase'
    );
  }
  render() {
    return this.props.children;
  }
}

export type ForceTouchGestureHandlerEventPayload = {
  x: number;
  y: number;
  absoluteX: number;
  absoluteY: number;

  /**
   * The pressure of a touch.
   */
  force: number;
};

export interface ForceTouchGestureConfig {
  /**
   *
   * A minimal pressure that is required before handler can activate. Should be a
   * value from range `[0.0, 1.0]`. Default is `0.2`.
   */
  minForce?: number;

  /**
   * A maximal pressure that could be applied for handler. If the pressure is
   * greater, handler fails. Should be a value from range `[0.0, 1.0]`.
   */
  maxForce?: number;

  /**
   * Boolean value defining if haptic feedback has to be performed on
   * activation.
   */
  feedbackOnActivation?: boolean;
}

export interface ForceTouchGestureHandlerProps
  extends BaseGestureHandlerProps<ForceTouchGestureHandlerEventPayload>,
    ForceTouchGestureConfig {}

export type ForceTouchGestureHandler = typeof ForceTouchGestureHandler & {
  forceTouchAvailable: boolean;
};
// eslint-disable-next-line @typescript-eslint/no-redeclare -- backward compatibility; see description on the top of gestureHandlerCommon.ts file
export const ForceTouchGestureHandler = PlatformConstants?.forceTouchAvailable
  ? createHandler<
      ForceTouchGestureHandlerProps,
      ForceTouchGestureHandlerEventPayload
    >({
      name: 'ForceTouchGestureHandler',
      allowedProps: [
        ...baseGestureHandlerProps,
        ...forceTouchGestureHandlerProps,
      ] as const,
      config: {},
    })
  : ForceTouchFallback;

(ForceTouchGestureHandler as ForceTouchGestureHandler).forceTouchAvailable =
  PlatformConstants?.forceTouchAvailable || false;

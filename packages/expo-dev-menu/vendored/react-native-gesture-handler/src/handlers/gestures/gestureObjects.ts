import { FlingGesture } from './flingGesture';
import { ForceTouchGesture } from './forceTouchGesture';
import { Gesture } from './gesture';
import {
  ComposedGesture,
  ExclusiveGesture,
  SimultaneousGesture,
} from './gestureComposition';
import { LongPressGesture } from './longPressGesture';
import { PanGesture } from './panGesture';
import { PinchGesture } from './pinchGesture';
import { RotationGesture } from './rotationGesture';
import { TapGesture } from './tapGesture';
import { NativeGesture } from './nativeGesture';
import { ManualGesture } from './manualGesture';

export const GestureObjects = {
  Tap: () => {
    return new TapGesture();
  },

  Pan: () => {
    return new PanGesture();
  },

  Pinch: () => {
    return new PinchGesture();
  },

  Rotation: () => {
    return new RotationGesture();
  },

  Fling: () => {
    return new FlingGesture();
  },

  LongPress: () => {
    return new LongPressGesture();
  },

  ForceTouch: () => {
    return new ForceTouchGesture();
  },

  Native: () => {
    return new NativeGesture();
  },

  Manual: () => {
    return new ManualGesture();
  },

  /**
   * Builds a composed gesture consisting of gestures provided as parameters.
   * The first one that becomes active cancels the rest of gestures.
   */
  Race: (...gestures: Gesture[]) => {
    return new ComposedGesture(...gestures);
  },

  /**
   * Builds a composed gesture that allows all base gestures to run simultaneously.
   */
  Simultaneous(...gestures: Gesture[]) {
    return new SimultaneousGesture(...gestures);
  },

  /**
   * Builds a composed gesture where only one of the provided gestures can become active.
   * Priority is decided through the order of gestures: the first one has higher priority
   * than the second one, second one has higher priority than the third one, and so on.
   * For example, to make a gesture that recognizes both single and double tap you need
   * to call Exclusive(doubleTap, singleTap).
   */
  Exclusive(...gestures: Gesture[]) {
    return new ExclusiveGesture(...gestures);
  },
};

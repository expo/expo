import { ComponentClass } from 'react';
import {
  GestureUpdateEvent,
  GestureStateChangeEvent,
} from '../gestureHandlerCommon';

export interface SharedValue<T> {
  value: T;
}

let Reanimated: {
  default: {
    // Slightly modified definition copied from 'react-native-reanimated'
    // eslint-disable-next-line @typescript-eslint/ban-types
    createAnimatedComponent<P extends object>(
      component: ComponentClass<P>,
      options?: unknown
    ): ComponentClass<P>;
  };
  useEvent: (
    callback: (event: GestureUpdateEvent | GestureStateChangeEvent) => void,
    events: string[],
    rebuild: boolean
  ) => unknown;
  useSharedValue: <T>(value: T) => SharedValue<T>;
  setGestureState: (handlerTag: number, newState: number) => void;
};

try {
  Reanimated = require('react-native-reanimated');

  if (!Reanimated.setGestureState) {
    Reanimated.setGestureState = () => {
      'worklet';
      console.warn(
        'Please use newer version of react-native-reanimated in order to control state of the gestures.'
      );
    };
  }
  // When 'react-native-reanimated' is not available we want to
  // quietly continue
  // eslint-disable-next-line no-empty
} catch (e) {}

export { Reanimated };

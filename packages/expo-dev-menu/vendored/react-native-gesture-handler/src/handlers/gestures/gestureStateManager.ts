import { Reanimated } from './reanimatedWrapper';
import { State } from '../../State';

export interface GestureStateManagerType {
  begin: () => void;
  activate: () => void;
  fail: () => void;
  end: () => void;
}

export const GestureStateManager = {
  create(handlerTag: number): GestureStateManagerType {
    'worklet';
    return {
      begin: () => {
        'worklet';
        if (Reanimated) {
          Reanimated.setGestureState(handlerTag, State.BEGAN);
        } else {
          console.warn(
            'react-native-reanimated is required in order to use synchronous state management'
          );
        }
      },

      activate: () => {
        'worklet';
        if (Reanimated) {
          Reanimated.setGestureState(handlerTag, State.ACTIVE);
        } else {
          console.warn(
            'react-native-reanimated is required in order to use synchronous state management'
          );
        }
      },

      fail: () => {
        'worklet';
        if (Reanimated) {
          Reanimated.setGestureState(handlerTag, State.FAILED);
        } else {
          console.warn(
            'react-native-reanimated is required in order to use synchronous state management'
          );
        }
      },

      end: () => {
        'worklet';
        if (Reanimated) {
          Reanimated.setGestureState(handlerTag, State.END);
        } else {
          console.warn(
            'react-native-reanimated is required in order to use synchronous state management'
          );
        }
      },
    };
  },
};

import { Easing } from 'react-native';

import type { TransitionSpec } from '../types';

export const FadeSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 150,
    // Resolve lazily so this module evaluates in React Server Components.
    // Reading `easing` still needs the client on native — `Easing` throws on the server there.
    get easing() {
      return Easing.in(Easing.linear);
    },
  },
};

export const ShiftSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 150,
    // Resolve lazily so this module evaluates in React Server Components.
    // Reading `easing` still needs the client on native — `Easing` throws on the server there.
    get easing() {
      return Easing.inOut(Easing.ease);
    },
  },
};

import { Easing } from 'react-native';

import type { TransitionSpec } from '../types';

export const FadeSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 150,
    easing: Easing.in(Easing.linear),
  },
};

export const ShiftSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 150,
    easing: Easing.inOut(Easing.ease),
  },
};

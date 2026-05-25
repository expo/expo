import { Easing, type EasingFunction } from 'react-native';

import type { TransitionSpec } from '../types';

const lazyMemo = (factory: () => EasingFunction): EasingFunction => {
  let cached: EasingFunction | undefined;
  return (t: number) => (cached ??= factory())(t);
};

export const FadeSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 150,
    easing: lazyMemo(() => Easing.in(Easing.linear)),
  },
};

export const ShiftSpec: TransitionSpec = {
  animation: 'timing',
  config: {
    duration: 150,
    easing: lazyMemo(() => Easing.inOut(Easing.ease)),
  },
};

'use client';
import { use } from 'react';

import { CardAnimationContext } from './CardAnimationContext';

export function useCardAnimation() {
  const animation = use(CardAnimationContext);

  if (animation === undefined) {
    throw new Error("Couldn't find values for card animation. Are you inside a screen in Stack?");
  }

  return animation;
}

'use client';
import { use } from 'react';

import { BottomTabBarHeightContext } from './BottomTabBarHeightContext';

export function useBottomTabBarHeight() {
  const height = use(BottomTabBarHeightContext);

  if (height === undefined) {
    throw new Error(
      "Couldn't find the bottom tab bar height. Are you inside a screen in Bottom Tab Navigator?"
    );
  }

  return height;
}

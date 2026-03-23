import { PixelRatio, Platform } from 'react-native';

import type { Layout } from '../types';

export function getDefaultHeaderHeight(
  layout: Layout,
  modalPresentation: boolean,
  topInset: number
): number {
  let headerHeight;

  // On models with Dynamic Island the status bar height is smaller than the safe area top inset.
  const hasDynamicIsland = Platform.OS === 'ios' && topInset > 50;
  const statusBarHeight = hasDynamicIsland
    ? topInset - (5 + 1 / PixelRatio.get())
    : topInset;

  const isLandscape = layout.width > layout.height;

  if (Platform.OS === 'ios') {
    if (Platform.isPad || Platform.isTV) {
      if (modalPresentation) {
        headerHeight = 56;
      } else {
        headerHeight = 50;
      }
    } else {
      if (isLandscape) {
        headerHeight = 32;
      } else {
        if (modalPresentation) {
          headerHeight = 56;
        } else {
          headerHeight = 44;
        }
      }
    }
  } else {
    headerHeight = 64;
  }

  return headerHeight + statusBarHeight;
}

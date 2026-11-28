import { PixelRatio, Platform } from 'react-native';

import type { Layout } from '../types';

export function getDefaultHeaderHeight(
  layout: Layout,
  modalPresentation: boolean,
  topInset: number,
  liquidGlass = false
): number {
  const isLandscape = layout.width > layout.height;

  // Liquid Glass bars: top spacing, a 44pt button row and 10pt below it
  if (Platform.OS === 'ios' && liquidGlass) {
    let topSpacing;

    if (Platform.isPad) {
      topSpacing = modalPresentation ? 10 : topInset;
    } else if (isLandscape) {
      topSpacing = 24;
    } else if (modalPresentation) {
      topSpacing = 16;
    } else {
      topSpacing = topInset;
    }

    return (topSpacing || 10) + 44 + 10;
  }

  let headerHeight;

  // On models with Dynamic Island the status bar height is smaller than the safe area top inset.
  const hasDynamicIsland = Platform.OS === 'ios' && topInset > 50;
  const statusBarHeight = hasDynamicIsland ? topInset - (5 + 1 / PixelRatio.get()) : topInset;

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

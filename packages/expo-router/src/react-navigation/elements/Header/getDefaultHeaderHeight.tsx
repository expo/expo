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
  const statusBarHeight = hasDynamicIsland ? topInset - (5 + 1 / PixelRatio.get()) : topInset;

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

/**
 * The default height of a header that JavaScript renders, with the bottom padding from
 * `getDefaultHeaderBottomPadding`. Native headers use `getDefaultHeaderHeight`.
 */
export function getDefaultJSHeaderHeight(
  layout: Layout,
  modalPresentation: boolean,
  topInset: number
): number {
  return (
    getDefaultHeaderHeight(layout, modalPresentation, topInset) +
    getDefaultHeaderBottomPadding(layout, modalPresentation)
  );
}

// Space below the title row of a JavaScript header on iPhone in portrait, which balances the title
// between the status bar and the content.
export function getDefaultHeaderBottomPadding(layout: Layout, modalPresentation: boolean): number {
  const isPhone = Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV;
  const isLandscape = layout.width > layout.height;
  return isPhone && !isLandscape && !modalPresentation ? 8 : 0;
}

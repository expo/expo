'use client';
import { createContext, useContext } from 'react';
import type { ColorValue } from 'react-native';

export type ToolbarPlacement = 'left' | 'right' | 'bottom';

/**
 * Context to track which toolbar placement the current component is in.
 * This allows shared components (Button, Menu, Spacer, etc.) to behave
 * differently based on their placement.
 */
export const ToolbarPlacementContext = createContext<ToolbarPlacement | null>(null);

export function useToolbarPlacement(): ToolbarPlacement | null {
  return useContext(ToolbarPlacementContext);
}

export interface ToolbarColors {
  tintColor?: ColorValue;
  backgroundColor?: ColorValue;
  buttonContainerColor?: ColorValue;
}

/**
 * Context for toolbar-level colors that cascade to child components (Button, Menu, etc.).
 * @platform android
 */
export const ToolbarColorContext = createContext<ToolbarColors>({});

export function useToolbarColors(): ToolbarColors {
  return useContext(ToolbarColorContext);
}

/**
 * Colors for an `IconButton` drawn in the toolbar's `buttonContainerColor`, the same when disabled.
 * Returns an empty object rather than `undefined` when unset, as Expo UI doesn't reset a prop
 * that becomes `undefined`.
 * @platform android
 */
export function getIconButtonContainerColors(buttonContainerColor: ColorValue | undefined): {
  containerColor?: ColorValue;
  disabledContainerColor?: ColorValue;
} {
  return buttonContainerColor
    ? { containerColor: buttonContainerColor, disabledContainerColor: buttonContainerColor }
    : {};
}

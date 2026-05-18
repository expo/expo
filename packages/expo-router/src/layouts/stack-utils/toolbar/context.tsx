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
}

/**
 * Context for toolbar-level colors that cascade to child components (Button, Menu, etc.).
 * @platform android
 */
export const ToolbarColorContext = createContext<ToolbarColors>({});

export function useToolbarColors(): ToolbarColors {
  return useContext(ToolbarColorContext);
}

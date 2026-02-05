'use client';
import { createContext, useContext } from 'react';

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

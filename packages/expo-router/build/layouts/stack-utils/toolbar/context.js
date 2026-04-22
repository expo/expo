'use client';
import { createContext, useContext } from 'react';
/**
 * Context to track which toolbar placement the current component is in.
 * This allows shared components (Button, Menu, Spacer, etc.) to behave
 * differently based on their placement.
 */
export const ToolbarPlacementContext = createContext(null);
export function useToolbarPlacement() {
    return useContext(ToolbarPlacementContext);
}
/**
 * Context for toolbar-level colors that cascade to child components (Button, Menu, etc.).
 * @platform android
 */
export const ToolbarColorContext = createContext({});
export function useToolbarColors() {
    return useContext(ToolbarColorContext);
}
//# sourceMappingURL=context.js.map
import type { ColorValue } from 'react-native';
export type ToolbarPlacement = 'left' | 'right' | 'bottom';
/**
 * Context to track which toolbar placement the current component is in.
 * This allows shared components (Button, Menu, Spacer, etc.) to behave
 * differently based on their placement.
 */
export declare const ToolbarPlacementContext: import("react").Context<ToolbarPlacement | null>;
export declare function useToolbarPlacement(): ToolbarPlacement | null;
export interface ToolbarColors {
    tintColor?: ColorValue;
    backgroundColor?: ColorValue;
}
/**
 * Context for toolbar-level colors that cascade to child components (Button, Menu, etc.).
 * @platform android
 */
export declare const ToolbarColorContext: import("react").Context<ToolbarColors>;
export declare function useToolbarColors(): ToolbarColors;
//# sourceMappingURL=context.d.ts.map
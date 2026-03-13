export type ToolbarPlacement = 'left' | 'right' | 'bottom';
/**
 * Context to track which toolbar placement the current component is in.
 * This allows shared components (Button, Menu, Spacer, etc.) to behave
 * differently based on their placement.
 */
export declare const ToolbarPlacementContext: import("react").Context<ToolbarPlacement | null>;
export declare function useToolbarPlacement(): ToolbarPlacement | null;
//# sourceMappingURL=context.d.ts.map
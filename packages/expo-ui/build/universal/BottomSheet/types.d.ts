import type { ModifierConfig } from '../../types';
/**
 * A snap point describing one of the heights a [`BottomSheet`](#bottomsheet) can rest at.
 *
 * - `'half'` — Approximately half-screen.
 * - `'full'` — Fully expanded.
 * - `{ fraction }` — A fraction of the screen height (0–1).
 *   iOS / web only.
 * - `{ height }` — A fixed pixel height.
 *   iOS / web only.
 *
 * On Android, `{ fraction }` and `{ height }` snap to the nearest of `'half'` / `'full'`.
 * See the component docs for platform behavior notes.
 */
export type SnapPoint = 'half' | 'full' | {
    fraction: number;
} | {
    height: number;
};
/**
 * Props for the [`BottomSheet`](#bottomsheet) component, a modal sheet that slides up from the bottom of the screen.
 */
export interface BottomSheetProps {
    /**
     * Content to render inside the bottom sheet.
     */
    children?: React.ReactNode;
    /**
     * Whether the bottom sheet is currently visible.
     */
    isPresented: boolean;
    /**
     * Called when the bottom sheet is dismissed by the user (e.g. swiping down or tapping the overlay).
     */
    onDismiss: () => void;
    /**
     * Whether to show a drag indicator at the top of the sheet.
     * @default true
     */
    showDragIndicator?: boolean;
    /**
     * Heights the sheet can rest at.
     * When omitted, the sheet auto-sizes to its content.
     * See [`SnapPoint`](#snappoint) for the supported values.
     *
     * @example `['half', 'full']` — draggable between half and full
     * @example `['full']` — always full height
     */
    snapPoints?: SnapPoint[];
    /**
     * Identifier used to locate the component in end-to-end tests.
     */
    testID?: string;
    /**
     * Platform-specific modifier escape hatch. Pass an array of modifier configs
     * from `@expo/ui/swift-ui/modifiers` or `@expo/ui/jetpack-compose/modifiers`.
     */
    modifiers?: ModifierConfig[];
}
//# sourceMappingURL=types.d.ts.map
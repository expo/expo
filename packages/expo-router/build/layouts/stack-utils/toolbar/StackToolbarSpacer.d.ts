import type { NativeStackHeaderItemSpacing } from '@react-navigation/native-stack';
export interface StackToolbarSpacerProps {
    /**
     * Whether the spacer should be hidden.
     *
     * @default false
     */
    hidden?: boolean;
    /**
     * The width of the spacing element.
     *
     * In Left/Right placements, width is required.
     * In Bottom placement, if width is not provided, the spacer will be flexible
     * and expand to fill available space.
     */
    width?: number;
    /**
     * Whether this spacer shares background with adjacent items.
     *
     * Only available in bottom placement.
     *
     * @platform iOS 26+
     */
    sharesBackground?: boolean;
}
/**
 * A spacing helper used inside `Stack.Toolbar` to create empty space between toolbar items.
 *
 * In left/right placements, width is required.
 * In bottom placement, if width is not provided, creates a flexible spacer that expands to fill space.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="arrow.left" />
 *         <Stack.Toolbar.Spacer width={8} />
 *         <Stack.Toolbar.Button icon="arrow.right" />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.Spacer />
 *         <Stack.Toolbar.Button icon="search" />
 *         <Stack.Toolbar.Spacer />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export declare const StackToolbarSpacer: React.FC<StackToolbarSpacerProps>;
export declare function convertStackToolbarSpacerPropsToRNHeaderItem(props: StackToolbarSpacerProps): NativeStackHeaderItemSpacing | undefined;
//# sourceMappingURL=StackToolbarSpacer.d.ts.map
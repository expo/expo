import type { NativeStackHeaderItemSpacing } from '@react-navigation/native-stack';
export interface StackHeaderSpacerProps {
    /**
     * Whether the spacer should be hidden.
     *
     * @default false
     */
    hidden?: boolean;
    /**
     * The width of the spacing element.
     *
     * This is typically used to create space between header elements.
     */
    width: number;
}
/**
 * A spacing helper used inside `Stack.Header.Left` or `Stack.Header.Right` to create
 * empty space between header items.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Screen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Left>
 *             <Stack.Header.Button icon="arrow.left" />
 *             <Stack.Header.Spacer width={8} />
 *             <Stack.Header.Button icon="arrow.right" />
 *           </Stack.Header.Left>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export declare const StackHeaderSpacer: React.FC<StackHeaderSpacerProps>;
export declare function convertStackHeaderSpacerPropsToRNHeaderItem({ hidden, width, }: StackHeaderSpacerProps): NativeStackHeaderItemSpacing | undefined;
//# sourceMappingURL=StackHeaderSpacer.d.ts.map
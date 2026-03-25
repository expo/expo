import type { StackToolbarButtonProps } from './types';
import type { NativeStackHeaderItemButton } from '../../../../react-navigation/native-stack';
export type { StackToolbarButtonProps, NativeToolbarButtonProps } from './types';
/**
 * A button used inside `Stack.Toolbar`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Toolbar placement="left">
 *           <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *         </Stack.Toolbar>
 *       </Stack.Screen>
 *     </Stack>
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
 *       <Stack.Toolbar placement="left">
 *         <Stack.Toolbar.Button icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export declare const StackToolbarButton: React.FC<StackToolbarButtonProps>;
export declare function convertStackToolbarButtonPropsToRNHeaderItem(props: StackToolbarButtonProps): NativeStackHeaderItemButton | undefined;
//# sourceMappingURL=index.d.ts.map
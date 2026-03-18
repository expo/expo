import type { NativeStackHeaderItemCustom } from '@react-navigation/native-stack';
import type { StackToolbarViewProps } from './types';
export type { StackToolbarViewProps, NativeToolbarViewProps } from './types';
/**
 * A wrapper to render custom content in the toolbar.
 *
 * Use inside `Stack.Toolbar` to render a custom React element.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * function CustomElement() {
 *   return <Text>Custom Element</Text>;
 * }
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.View>
 *           <CustomElement />
 *         </Stack.Toolbar.View>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export declare const StackToolbarView: React.FC<StackToolbarViewProps>;
export declare function convertStackToolbarViewPropsToRNHeaderItem(props: StackToolbarViewProps): NativeStackHeaderItemCustom | undefined;
//# sourceMappingURL=index.d.ts.map
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import React, { type ReactNode } from 'react';
export interface StackHeaderLeftProps {
    /**
     * Child elements to compose the left area of the header. Can include Stack.Header.Button,
     * Stack.Header.Menu, Stack.Header.Item, and Stack.Header.Spacer components.
     */
    children?: ReactNode;
    /**
     * When `true`, renders children as a custom component in the header left area,
     * replacing the default header left layout.
     *
     * @default false
     */
    asChild?: boolean;
}
export interface StackHeaderRightProps {
    /**
     * Child elements to compose the right area of the header. Can include Stack.Header.Button,
     * Stack.Header.Menu, Stack.Header.Item, and Stack.Header.Spacer components.
     */
    children?: ReactNode;
    /**
     * When `true`, renders children as a custom component in the header right area,
     * replacing the default header right layout.
     *
     * @default false
     */
    asChild?: boolean;
}
/**
 * The component used to configure the left area of the stack header.
 *
 * When used inside a screen, it allows you to customize the left side of the header dynamically.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header.Left>
 *         <Stack.Header.Button onPress={() => alert('Left button pressed!')} />
 *       </Stack.Header.Left>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * When used inside the layout, it needs to be wrapped in `Stack.Header` to take effect.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header>
 *           <Stack.Header.Left>
 *             <Stack.Header.Button onPress={() => alert('Left button pressed!')} />
 *           </Stack.Header.Left>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 */
export declare const StackHeaderLeft: React.FC<StackHeaderLeftProps>;
/**
 * The component used to configure the right area of the stack header.
 *
 * When used inside a screen, it allows you to customize the right side of the header dynamically.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header.Right>
 *         <Stack.Header.Button onPress={() => alert('Right button pressed!')} />
 *       </Stack.Header.Right>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * When used inside the layout, it needs to be wrapped in `Stack.Header` to take effect.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header>
 *           <Stack.Header.Right>
 *             <Stack.Header.Button onPress={() => alert('Right button pressed!')} />
 *           </Stack.Header.Right>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 */
export declare const StackHeaderRight: React.FC<StackHeaderRightProps>;
export declare function appendStackHeaderRightPropsToOptions(options: NativeStackNavigationOptions, props: StackHeaderRightProps): NativeStackNavigationOptions;
export declare function appendStackHeaderLeftPropsToOptions(options: NativeStackNavigationOptions, props: StackHeaderLeftProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackHeaderLeftRight.d.ts.map
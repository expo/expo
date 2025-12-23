import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { type PropsWithChildren } from 'react';
export interface StackScreenProps extends PropsWithChildren {
    name?: string;
    options?: NativeStackNavigationOptions;
    /**
     * Predefined values for a dynamic route parameter.
     * When specified on a dynamic route like `[param]`, this will create additional
     * screens for each predefined value that reuse the same component.
     *
     * @example
     * ```tsx
     * <Stack.Screen name="[param]" unstable_predefinedValues={["a", "b"]} />
     * // Creates screens: [param], a (with param="a"), b (with param="b")
     * ```
     */
    unstable_predefinedValues?: string[];
}
export declare function StackScreen({ children, options, ...rest }: StackScreenProps): import("react").JSX.Element;
export declare function appendScreenStackPropsToOptions(options: NativeStackNavigationOptions, props: StackScreenProps): NativeStackNavigationOptions;
//# sourceMappingURL=StackScreen.d.ts.map
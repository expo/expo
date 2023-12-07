import { ClassAttributes, ComponentProps, ComponentType } from 'react';
import { Pressable as NativePressable, StyleProp, ViewStyle, PressableStateCallbackType as NativePressableStateCallbackType } from 'react-native';
type NativePressableProps = ComponentProps<typeof NativePressable> & ClassAttributes<typeof NativePressable>;
export type PressableStateCallbackType = NativePressableStateCallbackType & {
    readonly pressed: boolean;
    readonly hovered: boolean;
    /** @platform web */
    readonly focused: boolean;
};
export type WebPressableProps = {
    /**
     * Either children or a render prop that receives a boolean reflecting whether
     * the component is currently pressed.
     */
    children?: React.ReactNode | ((state: PressableStateCallbackType) => React.ReactNode);
    /**
     * Either view styles or a function that receives a boolean reflecting whether
     * the component is currently pressed and returns view styles.
     */
    style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
};
export type PressableProps = Omit<NativePressableProps, 'children' | 'style'> & WebPressableProps;
export declare const Pressable: ComponentType<PressableProps>;
export {};
//# sourceMappingURL=Pressable.d.ts.map
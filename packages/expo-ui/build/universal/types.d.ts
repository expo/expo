import type { ViewStyle } from 'react-native';
import type { ModifierConfig } from '../types';
/**
 * Subset of React Native `ViewStyle` that maps cleanly to both SwiftUI modifiers
 * and Jetpack Compose modifiers. On web, passes through to React Native StyleSheet.
 */
export type UniversalStyle = Pick<ViewStyle, 'padding' | 'paddingHorizontal' | 'paddingVertical' | 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight' | 'backgroundColor' | 'borderRadius' | 'borderWidth' | 'borderColor' | 'opacity' | 'width' | 'height'>;
/**
 * Base props inherited by all universal components.
 */
export interface UniversalBaseProps {
    /**
     * Platform-agnostic style properties. These are translated to SwiftUI modifiers on iOS
     * and Jetpack Compose modifiers on Android.
     * @platform android
     * @platform ios
     * @platform web
     */
    style?: UniversalStyle;
    /**
     * Platform-specific modifier escape hatch. Pass an array of modifier configs
     * from `@expo/ui/swift-ui/modifiers` or `@expo/ui/jetpack-compose/modifiers`.
     * @platform android
     * @platform ios
     */
    modifiers?: ModifierConfig[];
    /**
     * Called when the component is pressed.
     * @platform android
     * @platform ios
     * @platform web
     */
    onPress?: () => void;
    /**
     * Called when the component appears on screen.
     * @platform android
     * @platform ios
     * @platform web
     */
    onAppear?: () => void;
    /**
     * Called when the component is removed from screen.
     * @platform android
     * @platform ios
     * @platform web
     */
    onDisappear?: () => void;
    /**
     * Whether the component is disabled. Disabled components do not respond to user interaction.
     * @platform android
     * @platform ios
     * @platform web
     */
    disabled?: boolean;
    /**
     * Whether the component is hidden.
     * @platform android
     * @platform ios
     * @platform web
     */
    hidden?: boolean;
    /**
     * Identifier used to locate the component in end-to-end tests.
     * @platform android
     * @platform ios
     * @platform web
     */
    testID?: string;
}
/**
 * Cross-axis alignment for layout components such as [`Column`](#column) and [`Row`](#row).
 */
export type UniversalAlignment = 'start' | 'center' | 'end';
//# sourceMappingURL=types.d.ts.map
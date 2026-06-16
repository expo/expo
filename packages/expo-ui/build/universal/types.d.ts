import type { Ref } from 'react';
import type { ViewStyle } from 'react-native';
import type { ModifierConfig } from '../types';
/**
 * Subset of React Native `ViewStyle` that maps cleanly to both SwiftUI modifiers
 * and Jetpack Compose modifiers. On web, passes through to React Native StyleSheet.
 * @docsInline
 */
export type UniversalStyle = Pick<ViewStyle, 'padding' | 'paddingHorizontal' | 'paddingVertical' | 'paddingTop' | 'paddingBottom' | 'paddingLeft' | 'paddingRight' | 'backgroundColor' | 'borderRadius' | 'borderWidth' | 'borderColor' | 'opacity' | 'width' | 'height'>;
/**
 * Base props inherited by all universal components.
 * @docsInline
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
     * A modifier supplied here replaces any modifier of the same type that the
     * component derives from `style` or other props.
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
    /**
     * Forwarded to the underlying native view: the SwiftUI view on iOS, the Jetpack
     * Compose view on Android, or the rendered React Native element on web. An escape
     * hatch for advanced cases that need the native handle; not part of the public API.
     * @hidden
     */
    ref?: Ref<any>;
}
/**
 * Cross-axis alignment for layout components such as `Column` and `Row`.
 * @docsInline
 */
export type UniversalAlignment = 'start' | 'center' | 'end';
//# sourceMappingURL=types.d.ts.map
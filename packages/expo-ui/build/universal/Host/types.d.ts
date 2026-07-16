import type { ColorSchemeName, ColorValue, ViewProps } from 'react-native';
/**
 * Props for the [`Host`](#host) component.
 */
export interface UniversalHostProps extends ViewProps {
    /**
     * When `true`, the host updates its size in the React Native view tree to match the content's layout from the underlying platform UI toolkit.
     * Can only be set once on mount.
     *
     * @default false
     * @platform android
     * @platform ios
     * @platform web
     */
    matchContents?: boolean | {
        vertical?: boolean;
        horizontal?: boolean;
    };
    /**
     * The color scheme to apply to the subtree.
     * `'light'` / `'dark'` force a specific appearance; omitted follows the device setting.
     *
     * @platform android
     * @platform ios
     * @platform web
     */
    colorScheme?: ColorSchemeName;
    /**
     * Seed color used to derive the theme applied to the host's subtree. Each platform interprets it natively:
     * - On Android, it generates a full Material 3 palette (`SchemeTonalSpot`, the same algorithm as Material You) that themes Compose children and is exposed to descendants via `useMaterialColors()`.
     * - On iOS, it is applied as the SwiftUI tint, propagating through the environment to theme interactive controls such as buttons, switches, and sliders.
     * - On web, it generates a primary color scale exposed as CSS variables to the subtree.
     *
     * When omitted, each platform falls back to its default theme.
     *
     * @platform android
     * @platform ios
     * @platform web
     */
    seedColor?: ColorValue;
    /**
     * Layout direction for the platform UI content.
     * Defaults to the current locale direction from `I18nManager`.
     *
     * @platform android
     * @platform ios
     * @platform web
     */
    layoutDirection?: 'leftToRight' | 'rightToLeft';
    /**
     * Controls which safe area regions the hosting view should ignore.
     * - `'all'`- ignores all safe area insets.
     * - `'keyboard'` - ignores only the keyboard safe area.
     *
     * @platform android
     * @platform ios
     * @platform web
     */
    ignoreSafeArea?: 'all' | 'keyboard';
    /**
     * When true and no explicit size is provided, the host will use the viewport size as the proposed size for layout.
     * This is particularly useful for views that need to fill their available space, such as `List`.
     * @default false
     *
     * @platform android
     * @platform ios
     * @platform web
     */
    useViewportSizeMeasurement?: boolean;
    /**
     * Callback function that is triggered when the content completes its layout.
     * Provides the current dimensions of the content, which may change as the content updates.
     *
     * @platform android
     * @platform ios
     * @platform web
     */
    onLayoutContent?: (event: {
        nativeEvent: {
            width: number;
            height: number;
        };
    }) => void;
    children?: React.ReactNode;
}
//# sourceMappingURL=types.d.ts.map
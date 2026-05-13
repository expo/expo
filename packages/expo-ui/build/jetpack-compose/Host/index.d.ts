import { type ColorSchemeName, type ColorValue, type StyleProp, type ViewStyle } from 'react-native';
import { type PrimitiveBaseProps } from '../layout';
export type HostProps = {
    /**
     * When true, the host view will update its size in the React Native view tree to match the content's layout from Jetpack Compose.
     * Can be only set once on mount.
     * @default false
     */
    matchContents?: boolean | {
        vertical?: boolean;
        horizontal?: boolean;
    };
    /**
     * Callback function that is triggered when the Jetpack Compose content completes its layout.
     * Provides the current dimensions of the content, which may change as the content updates.
     */
    onLayoutContent?: (event: {
        nativeEvent: {
            width: number;
            height: number;
        };
    }) => void;
    /**
     * When true and no explicit size is provided, the host will use the viewport size as the proposed size for Compose layout.
     * This is particularly useful for views that need to fill their available space.
     * @default false
     */
    useViewportSizeMeasurement?: boolean;
    /**
     * The color scheme of the host view. `'light'` / `'dark'` force a specific
     * appearance; omitted follows the device setting. The palette itself
     * follows the device wallpaper on Android 12+ (Material You) or the static
     * Material 3 baseline otherwise — unless {@link seedColor} is set.
     */
    colorScheme?: ColorSchemeName;
    /**
     * Seed color used to generate a Material 3 palette (`SchemeTonalSpot`) for
     * this host. Combines with `colorScheme` (`'light'` / `'dark'` or omitted)
     * to produce a seeded palette that themes Compose children and is
     * available to descendants via `useMaterialColors()`.
     */
    seedColor?: ColorValue;
    /**
     * The layout direction for the content.
     * Defaults to the current locale direction from I18nManager.
     */
    layoutDirection?: 'leftToRight' | 'rightToLeft';
    /**
     * When `true`, the Compose content will not perform keyboard avoidance behaviour when keyboard is shown.
     * Can be only set once on mount.
     * @default false
     */
    ignoreSafeAreaKeyboardInsets?: boolean;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
} & PrimitiveBaseProps;
export declare function Host(props: HostProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map
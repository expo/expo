import { type ColorSchemeName, StyleProp, ViewStyle } from 'react-native';
import { PrimitiveBaseProps } from '../layout';
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
     * The color scheme of the host view.
     */
    colorScheme?: ColorSchemeName;
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
export declare function Host(props: HostProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map
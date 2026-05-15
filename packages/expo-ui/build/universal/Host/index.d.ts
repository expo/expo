import { type ViewProps } from 'react-native';
type HostProps = {
    ignoreSafeArea?: 'all' | 'keyboard';
    layoutDirection?: 'leftToRight' | 'rightToLeft';
    matchContents?: boolean | {
        horizontal?: boolean;
        vertical?: boolean;
    };
    onLayoutContent?: (event: {
        nativeEvent: {
            width: number;
            height: number;
        };
    }) => void;
    useViewportSizeMeasurement?: boolean;
};
/**
 * A bridging container that hosts SwiftUI views on iOS and Jetpack Compose views on Android.
 */
export declare function Host({ children, ignoreSafeArea, layoutDirection, matchContents, onLayout, onLayoutContent, style, useViewportSizeMeasurement, ...rest }: ViewProps & HostProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map
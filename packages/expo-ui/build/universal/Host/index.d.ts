import { type ViewProps } from 'react-native';
/**
 * A bridging container that hosts SwiftUI views on iOS and Jetpack Compose views on Android.
 */
export declare function Host({ children, style, ...rest }: ViewProps & {
    matchContents?: boolean | {
        vertical?: boolean;
        horizontal?: boolean;
    };
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map
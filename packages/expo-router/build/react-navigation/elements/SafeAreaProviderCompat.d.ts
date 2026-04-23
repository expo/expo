import * as React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
type Props = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};
export declare function SafeAreaProviderCompat({ children, style }: Props): import("react/jsx-runtime").JSX.Element;
export declare namespace SafeAreaProviderCompat {
    var initialMetrics: import("react-native-safe-area-context").Metrics;
}
export {};
//# sourceMappingURL=SafeAreaProviderCompat.d.ts.map
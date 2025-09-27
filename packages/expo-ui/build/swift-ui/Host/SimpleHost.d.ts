import { StyleProp, ViewStyle, type ColorSchemeName } from 'react-native';
import { type CommonViewModifierProps } from '../types';
export type SimpleHostProps = {
    /**
     * The color scheme of the host view.
     */
    colorScheme?: ColorSchemeName;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
} & CommonViewModifierProps;
/**
 * A hosting component for SwiftUI views.
 */
export declare function SimpleHost(props: SimpleHostProps): import("react").JSX.Element;
//# sourceMappingURL=SimpleHost.d.ts.map
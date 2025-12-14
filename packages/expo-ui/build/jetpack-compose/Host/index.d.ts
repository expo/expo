import { type ColorSchemeName, StyleProp, ViewStyle } from 'react-native';
import { PrimitiveBaseProps } from '../layout';
export type HostProps = {
    /**
     * The color scheme of the host view.
     */
    colorScheme?: ColorSchemeName;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
} & PrimitiveBaseProps;
export declare function Host(props: HostProps): import("react").JSX.Element | null;
//# sourceMappingURL=index.d.ts.map
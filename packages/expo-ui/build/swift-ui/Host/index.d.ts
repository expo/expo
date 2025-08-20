import { StyleProp, ViewStyle, type ColorSchemeName } from 'react-native';
import { type CommonViewModifierProps } from '../types';
export type HostProps = {
    /**
     * When true, the host view will update its size in the React Native view tree to match the content's layout from SwiftUI.
     * @default false
     */
    matchContents?: boolean | {
        vertical?: boolean;
        horizontal?: boolean;
    };
    /**
     * Callback function that is triggered when the SwiftUI content completes its layout.
     * Provides the current dimensions of the content, which may change as the content updates.
     */
    onLayoutContent?: (event: {
        nativeEvent: {
            width: number;
            height: number;
        };
    }) => void;
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
export declare function Host(props: HostProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map
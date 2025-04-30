import { StyleProp, ViewStyle } from 'react-native';
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
     * When true and no explicit size is provided, the host will use the viewport size as the proposed size for SwiftUI layout.
     * This is particularly useful for SwiftUI views that need to fill their available space, such as `Form`.
     * @default false
     */
    useViewportSizeMeasurement?: boolean;
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
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
};
/**
 * A hosting component for SwiftUI views.
 */
export declare function Host(props: HostProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map
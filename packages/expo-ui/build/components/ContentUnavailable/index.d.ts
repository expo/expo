import { StyleProp, ViewStyle, TextStyle } from 'react-native';
/**
 * Displays a native Swift UI ContentUnavailable view
 *
 * @remarks
 *  Working on: Android reimplemtation with jetpack compose
 *
 */
export type ContentUnavailableProps = {
    /**
     * A short title that describes why the content is not available.
     */
    title?: string;
    /**
     * SF Symbol indicating why the content is not available.
     */
    systemImage?: string;
    /**
     * Icon Fallback for web as React Node. (web only)
     * @platform web
     */
    webIconComponent?: React.ReactNode;
    /**
     * Styling for the title. (web only)
     * @platform web
     */
    webTitleStyle?: TextStyle;
    /**
     * Styling for the description. (web only)
     * @platform web
     */
    webDescriptionStyle?: TextStyle;
    /**
     * Description of why the content is not available.
     */
    description?: React.ReactNode;
    /**
     * Additional styling.
     */
    style?: StyleProp<ViewStyle>;
};
export declare function ContentUnavailableView(props: ContentUnavailableProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map
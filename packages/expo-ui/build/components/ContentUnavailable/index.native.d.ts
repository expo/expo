import { StyleProp, ViewStyle } from 'react-native';
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
  * Visibiloty State
  */
    isExpanded?: boolean;
    /**
     * SF Symbol indicating why the content is not available.
     */
    systemImage?: string;
    /**
     * Description of why the content is not available.
     */
    description: React.ReactNode;
    /**
     * Additional styling.
     */
    style?: StyleProp<ViewStyle>;
};
export declare function ContentUnavailableView(props: ContentUnavailableProps): import("react").JSX.Element;
//# sourceMappingURL=index.native.d.ts.map
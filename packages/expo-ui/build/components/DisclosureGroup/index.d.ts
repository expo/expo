import { StyleProp, TextStyle, ViewStyle } from 'react-native';
export type DisclosureGroupProps = {
    /**
     * Title of the DisclosureGroup.
     */
    title: string;
    /**
     * Expandation state of the DisclosureGroup.
     */
    isExpanded?: boolean;
    /**
     * A callback that is called when the state chnages.
     */
    onStateChange?: (isExpanded: boolean) => void;
    /**
     * Additional styling.
     */
    style?: StyleProp<ViewStyle>;
    /**
     * Styling for the title of the group
     * @platform web + android
     */
    webTitleStyle?: TextStyle;
    /**
     * Content of the DisclosureGroup as children.
     */
    children: React.ReactNode;
};
export declare function DisclosureGroup(props: DisclosureGroupProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map
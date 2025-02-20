import { StyleProp, TextStyle, ViewStyle } from "react-native";
export type DisclosureGroupProps = {
    /**
     * Title of the DisclosureGroup.
     */
    title: string;
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
export default DisclosureGroupProps;
//# sourceMappingURL=index.types.d.ts.map
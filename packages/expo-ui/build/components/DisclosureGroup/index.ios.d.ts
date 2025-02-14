import { StyleProp, ViewStyle } from 'react-native';
/**
 * Displays a native DisclosureGroup
 *
 * @remarks
 *  Working on: Android reimplemtation with jetpack compose
 *
 *
 */
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
     * Content of the DisclosureGroup as children.
     */
    children: React.ReactNode;
};
export declare function DisclosureGroup(props: DisclosureGroupProps): import("react").JSX.Element;
//# sourceMappingURL=index.ios.d.ts.map
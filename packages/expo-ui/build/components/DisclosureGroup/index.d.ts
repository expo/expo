import React from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
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
     * Styling for the title of the group
     * @platform web + android
     */
    webTitleStyle?: TextStyle;
    /**
     * Content of the DisclosureGroup as children.
     */
    children: React.ReactNode;
};
export declare function DisclosureGroup(props: DisclosureGroupProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map
import { type ColorValue } from 'react-native';
import { ExpoModifier } from '../../types';
/**
 * Colors for list item's core elements.
 */
export type ListItemColors = {
    containerColor?: ColorValue;
    headlineColor?: ColorValue;
    leadingIconColor?: ColorValue;
    trailingIconColor?: ColorValue;
    supportingColor?: ColorValue;
    overlineColor?: ColorValue;
};
export type ListItemProps = {
    /**
     * The main text content of the list item.
     */
    headline: string;
    /**
     * Optional supporting text displayed below the headline.
     */
    supportingText?: string;
    /**
     * Optional overline text displayed above the headline.
     */
    overlineText?: string;
    /**
     * The background color of the list item.
     */
    color?: ColorValue;
    /**
     * Colors for list item's core elements.
     */
    colors?: ListItemColors;
    /**
     * Callback that is called when the list item is pressed.
     */
    onPress?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
    /**
     * Children containing Leading and Trailing slots.
     */
    children?: React.ReactNode;
};
type LeadingProps = {
    children: React.ReactNode;
};
type TrailingProps = {
    children: React.ReactNode;
};
type SupportingContentProps = {
    children: React.ReactNode;
};
/**
 * Leading content slot for ListItem.
 */
export declare function ListItemLeading(props: LeadingProps): import("react").JSX.Element;
export declare namespace ListItemLeading {
    var tag: string;
}
/**
 * Trailing content slot for ListItem.
 */
export declare function ListItemTrailing(props: TrailingProps): import("react").JSX.Element;
export declare namespace ListItemTrailing {
    var tag: string;
}
/**
 * Custom supporting content slot for ListItem.
 * When provided, this takes precedence over the `supportingText` prop.
 * @platform android
 */
export declare function ListItemSupportingContent(props: SupportingContentProps): import("react").JSX.Element;
export declare namespace ListItemSupportingContent {
    var tag: string;
}
/**
 * A list item component following Material 3 design guidelines.
 */
declare function ListItemComponent(props: ListItemProps): import("react").JSX.Element;
declare namespace ListItemComponent {
    var Leading: typeof ListItemLeading;
    var Trailing: typeof ListItemTrailing;
    var SupportingContent: typeof ListItemSupportingContent;
}
export { ListItemComponent as ListItem };
//# sourceMappingURL=index.d.ts.map
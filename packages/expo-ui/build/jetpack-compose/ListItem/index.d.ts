import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
/**
 * Colors for list item elements, matching `ListItemDefaults.colors()`.
 */
export type ListItemColors = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
    leadingContentColor?: ColorValue;
    trailingContentColor?: ColorValue;
    supportingContentColor?: ColorValue;
    overlineContentColor?: ColorValue;
};
export type ListItemProps = {
    /**
     * Colors for list item elements.
     */
    colors?: ListItemColors;
    /**
     * Tonal elevation in dp.
     * @default ListItemDefaults.Elevation
     */
    tonalElevation?: number;
    /**
     * Shadow elevation in dp.
     * @default ListItemDefaults.Elevation
     */
    shadowElevation?: number;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing slot sub-components.
     */
    children?: React.ReactNode;
};
/**
 * A list item matching Compose's `ListItem`.
 */
declare function ListItemComponent(props: ListItemProps): import("react/jsx-runtime").JSX.Element;
declare namespace ListItemComponent {
    var HeadlineContent: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var OverlineContent: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var SupportingContent: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var LeadingContent: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var TrailingContent: (props: {
        children: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
}
export { ListItemComponent as ListItem };
//# sourceMappingURL=index.d.ts.map
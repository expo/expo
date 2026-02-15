import React from 'react';
import { ExpoModifier } from '../../types';
export type ListItemProps = {
    /**
     * Primary text displayed in the list item.
     */
    headline: string;
    /**
     * Secondary text displayed below the headline.
     */
    supportingText?: string;
    /**
     * Text displayed above the headline.
     */
    overlineText?: string;
    /**
     * Leading icon name (Material Icons, e.g. `"filled.Settings"`).
     */
    leadingIcon?: string;
    /**
     * Trailing icon name (Material Icons, e.g. `"filled.ChevronRight"`).
     */
    trailingIcon?: string;
    /**
     * Size of the leading icon in dp.
     * @default 24
     */
    leadingIconSize?: number;
    /**
     * Size of the trailing icon in dp.
     * @default 24
     */
    trailingIconSize?: number;
    /**
     * Background color of the list item.
     */
    containerColor?: string;
    /**
     * Color of the headline text.
     */
    headlineColor?: string;
    /**
     * Color of the supporting text.
     */
    supportingColor?: string;
    /**
     * Tint color for the leading icon.
     */
    leadingIconColor?: string;
    /**
     * Tint color for the trailing icon.
     */
    trailingIconColor?: string;
    /**
     * Callback fired when the list item is pressed.
     */
    onPress?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
export declare function ListItem(props: ListItemProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map
import { ReactNode } from 'react';
import { ModifierConfig } from '../../types';
/**
 * Props for the `ExposedDropdownMenuBox` component.
 */
export type ExposedDropdownMenuBoxProps = {
    /**
     * The text displayed in the text field.
     */
    value?: string;
    /**
     * Callback function that is called when the expanded state changes.
     */
    onExpandedChange?: (expanded: boolean) => void;
    /**
     * Whether the dropdown menu is expanded (visible).
     * @default false
     */
    expanded?: boolean;
    /**
     * Slot children for the label and items.
     */
    children?: ReactNode;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
};
/**
 * Displays a text field with a dropdown menu for selecting from a list of options.
 * Wraps Jetpack Compose's `ExposedDropdownMenuBox` component.
 *
 * @platform android
 */
declare function ExposedDropdownMenuBoxComponent(props: ExposedDropdownMenuBoxProps): import("react").JSX.Element;
declare namespace ExposedDropdownMenuBoxComponent {
    var Label: (props: {
        children: ReactNode;
    }) => import("react").JSX.Element;
    var Items: (props: {
        children: ReactNode;
    }) => import("react").JSX.Element;
}
export { ExposedDropdownMenuBoxComponent as ExposedDropdownMenuBox };
//# sourceMappingURL=index.d.ts.map
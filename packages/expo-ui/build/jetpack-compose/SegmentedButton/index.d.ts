import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
/**
 * Colors for the segmented button in different states.
 */
export type SegmentedButtonColors = {
    activeBorderColor?: ColorValue;
    activeContentColor?: ColorValue;
    inactiveBorderColor?: ColorValue;
    inactiveContentColor?: ColorValue;
    disabledActiveBorderColor?: ColorValue;
    disabledActiveContentColor?: ColorValue;
    disabledInactiveBorderColor?: ColorValue;
    disabledInactiveContentColor?: ColorValue;
    activeContainerColor?: ColorValue;
    inactiveContainerColor?: ColorValue;
    disabledActiveContainerColor?: ColorValue;
    disabledInactiveContainerColor?: ColorValue;
};
export type SegmentedButtonProps = {
    /**
     * Whether the button is currently selected (used inside `SingleChoiceSegmentedButtonRow`).
     */
    selected?: boolean;
    /**
     * Callback that is called when the button is clicked (used inside `SingleChoiceSegmentedButtonRow`).
     */
    onClick?: () => void;
    /**
     * Whether the button is currently checked (used inside `MultiChoiceSegmentedButtonRow`).
     */
    checked?: boolean;
    /**
     * Callback that is called when the checked state changes (used inside `MultiChoiceSegmentedButtonRow`).
     */
    onCheckedChange?: (checked: boolean) => void;
    /**
     * Whether the button is enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * Colors for the button in different states.
     */
    colors?: SegmentedButtonColors;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing a `Label` slot.
     */
    children?: React.ReactNode;
};
/**
 * Label slot for `SegmentedButton`.
 */
declare function SegmentedButtonLabel(props: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * A Material 3 segmented button. Must be used inside a `SingleChoiceSegmentedButtonRow`
 * or `MultiChoiceSegmentedButtonRow`.
 */
declare function SegmentedButtonComponent(props: SegmentedButtonProps): import("react/jsx-runtime").JSX.Element;
declare namespace SegmentedButtonComponent {
    var Label: typeof SegmentedButtonLabel;
}
export { SegmentedButtonComponent as SegmentedButton };
export { SingleChoiceSegmentedButtonRow } from '../SingleChoiceSegmentedButtonRow';
export type { SingleChoiceSegmentedButtonRowProps } from '../SingleChoiceSegmentedButtonRow';
export { MultiChoiceSegmentedButtonRow } from '../MultiChoiceSegmentedButtonRow';
export type { MultiChoiceSegmentedButtonRowProps } from '../MultiChoiceSegmentedButtonRow';
//# sourceMappingURL=index.d.ts.map
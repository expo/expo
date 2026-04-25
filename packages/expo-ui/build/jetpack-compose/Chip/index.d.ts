import { type ColorValue } from 'react-native';
import { type ModifierConfig } from '../../types';
/**
 * Colors for AssistChip.
 */
export type AssistChipColors = {
    containerColor?: ColorValue;
    labelColor?: ColorValue;
    leadingIconContentColor?: ColorValue;
    trailingIconContentColor?: ColorValue;
};
/**
 * Colors for FilterChip.
 */
export type FilterChipColors = {
    containerColor?: ColorValue;
    labelColor?: ColorValue;
    iconColor?: ColorValue;
    selectedContainerColor?: ColorValue;
    selectedLabelColor?: ColorValue;
    selectedLeadingIconColor?: ColorValue;
    selectedTrailingIconColor?: ColorValue;
};
/**
 * Colors for InputChip.
 */
export type InputChipColors = {
    containerColor?: ColorValue;
    labelColor?: ColorValue;
    leadingIconColor?: ColorValue;
    trailingIconColor?: ColorValue;
    selectedContainerColor?: ColorValue;
    selectedLabelColor?: ColorValue;
    selectedLeadingIconColor?: ColorValue;
    selectedTrailingIconColor?: ColorValue;
};
/**
 * Colors for SuggestionChip.
 */
export type SuggestionChipColors = {
    containerColor?: ColorValue;
    labelColor?: ColorValue;
    iconContentColor?: ColorValue;
};
/**
 * Border configuration for chips.
 */
export type ChipBorder = {
    /**
     * Border width in dp.
     * @default 1
     */
    width?: number;
    /**
     * Border color.
     */
    color?: ColorValue;
};
type SlotChildProps = {
    children: React.ReactNode;
};
export type AssistChipProps = {
    /**
     * Whether the chip is enabled and can be clicked.
     * @default true
     */
    enabled?: boolean;
    /**
     * Colors for the chip's container, label, and icons.
     */
    colors?: AssistChipColors;
    /**
     * Elevation in dp.
     */
    elevation?: number;
    /**
     * Border configuration.
     */
    border?: ChipBorder;
    /**
     * Callback fired when the chip is clicked.
     */
    onClick?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing Label, LeadingIcon, and TrailingIcon slots.
     */
    children: React.ReactNode;
};
/**
 * Label slot for AssistChip.
 */
declare function AssistChipLabel(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * Leading icon slot for AssistChip.
 */
declare function AssistChipLeadingIcon(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * Trailing icon slot for AssistChip.
 */
declare function AssistChipTrailingIcon(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * An assist chip that helps users complete actions and primary tasks.
 */
declare function AssistChipComponent(props: AssistChipProps): import("react/jsx-runtime").JSX.Element;
declare namespace AssistChipComponent {
    var Label: typeof AssistChipLabel;
    var LeadingIcon: typeof AssistChipLeadingIcon;
    var TrailingIcon: typeof AssistChipTrailingIcon;
}
export { AssistChipComponent as AssistChip };
export type FilterChipProps = {
    /**
     * Whether the chip is currently selected.
     */
    selected: boolean;
    /**
     * Whether the chip is enabled and can be interacted with.
     */
    enabled?: boolean;
    /**
     * Colors for the chip's container, label, icon, and selected states.
     */
    colors?: FilterChipColors;
    /**
     * Elevation in dp.
     */
    elevation?: number;
    /**
     * Border configuration.
     */
    border?: ChipBorder;
    /**
     * Callback fired when the chip is clicked.
     */
    onClick?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing Label, LeadingIcon, and TrailingIcon slots.
     */
    children: React.ReactNode;
};
/**
 * Label slot for FilterChip.
 */
declare function FilterChipLabel(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * Leading icon slot for FilterChip.
 */
declare function FilterChipLeadingIcon(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * Trailing icon slot for FilterChip.
 */
declare function FilterChipTrailingIcon(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * A filter chip component for refining content with selection/deselection.
 */
declare function FilterChipComponent(props: FilterChipProps): import("react/jsx-runtime").JSX.Element;
declare namespace FilterChipComponent {
    var Label: typeof FilterChipLabel;
    var LeadingIcon: typeof FilterChipLeadingIcon;
    var TrailingIcon: typeof FilterChipTrailingIcon;
}
export { FilterChipComponent as FilterChip };
export type InputChipProps = {
    /**
     * Whether the chip is enabled and can be interacted with.
     * @default true
     */
    enabled?: boolean;
    /**
     * Whether the chip is selected.
     * @default false
     */
    selected?: boolean;
    /**
     * Colors for the chip's container, label, icons, and selected states.
     */
    colors?: InputChipColors;
    /**
     * Elevation in dp.
     */
    elevation?: number;
    /**
     * Border configuration.
     */
    border?: ChipBorder;
    /**
     * Callback fired when the chip is clicked.
     */
    onClick?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing Label, Avatar, and TrailingIcon slots.
     */
    children: React.ReactNode;
};
/**
 * Label slot for InputChip.
 */
declare function InputChipLabel(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * Avatar slot for InputChip.
 */
declare function InputChipAvatar(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * Trailing icon slot for InputChip.
 */
declare function InputChipTrailingIcon(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * An input chip that represents user input and can be dismissed.
 */
declare function InputChipComponent(props: InputChipProps): import("react/jsx-runtime").JSX.Element;
declare namespace InputChipComponent {
    var Label: typeof InputChipLabel;
    var Avatar: typeof InputChipAvatar;
    var TrailingIcon: typeof InputChipTrailingIcon;
}
export { InputChipComponent as InputChip };
export type SuggestionChipProps = {
    /**
     * Whether the chip is enabled and can be clicked.
     * @default true
     */
    enabled?: boolean;
    /**
     * Colors for the chip's container, label, and icon.
     */
    colors?: SuggestionChipColors;
    /**
     * Elevation in dp.
     */
    elevation?: number;
    /**
     * Border configuration.
     */
    border?: ChipBorder;
    /**
     * Callback fired when the chip is clicked.
     */
    onClick?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing Label and Icon slots.
     */
    children: React.ReactNode;
};
/**
 * Label slot for SuggestionChip.
 */
declare function SuggestionChipLabel(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * Icon slot for SuggestionChip.
 */
declare function SuggestionChipIcon(props: SlotChildProps): import("react/jsx-runtime").JSX.Element;
/**
 * A suggestion chip that offers contextual suggestions and recommendations.
 */
declare function SuggestionChipComponent(props: SuggestionChipProps): import("react/jsx-runtime").JSX.Element;
declare namespace SuggestionChipComponent {
    var Label: typeof SuggestionChipLabel;
    var Icon: typeof SuggestionChipIcon;
}
export { SuggestionChipComponent as SuggestionChip };
//# sourceMappingURL=index.d.ts.map
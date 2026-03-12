import { type ModifierConfig } from '../../types';
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
     * Callback fired when the chip is clicked.
     */
    onPress?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing Label, LeadingIcon, and TrailingIcon slots.
     */
    children?: React.ReactNode;
};
/**
 * Label slot for AssistChip.
 */
declare function AssistChipLabel(props: SlotChildProps): import("react").JSX.Element;
/**
 * Leading icon slot for AssistChip.
 */
declare function AssistChipLeadingIcon(props: SlotChildProps): import("react").JSX.Element;
/**
 * Trailing icon slot for AssistChip.
 */
declare function AssistChipTrailingIcon(props: SlotChildProps): import("react").JSX.Element;
/**
 * An assist chip that helps users complete actions and primary tasks.
 */
declare function AssistChipComponent(props: AssistChipProps): import("react").JSX.Element;
declare namespace AssistChipComponent {
    var Label: typeof AssistChipLabel;
    var LeadingIcon: typeof AssistChipLeadingIcon;
    var TrailingIcon: typeof AssistChipTrailingIcon;
}
export { AssistChipComponent as AssistChip };
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
     * Callback fired when the chip is clicked.
     */
    onPress?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing Label, Avatar, and TrailingIcon slots.
     */
    children?: React.ReactNode;
};
/**
 * Label slot for InputChip.
 */
declare function InputChipLabel(props: SlotChildProps): import("react").JSX.Element;
/**
 * Avatar slot for InputChip.
 */
declare function InputChipAvatar(props: SlotChildProps): import("react").JSX.Element;
/**
 * Trailing icon slot for InputChip.
 */
declare function InputChipTrailingIcon(props: SlotChildProps): import("react").JSX.Element;
/**
 * An input chip that represents user input and can be dismissed.
 */
declare function InputChipComponent(props: InputChipProps): import("react").JSX.Element;
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
     * Callback fired when the chip is clicked.
     */
    onPress?: () => void;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing Label and Icon slots.
     */
    children?: React.ReactNode;
};
/**
 * Label slot for SuggestionChip.
 */
declare function SuggestionChipLabel(props: SlotChildProps): import("react").JSX.Element;
/**
 * Icon slot for SuggestionChip.
 */
declare function SuggestionChipIcon(props: SlotChildProps): import("react").JSX.Element;
/**
 * A suggestion chip that offers contextual suggestions and recommendations.
 */
declare function SuggestionChipComponent(props: SuggestionChipProps): import("react").JSX.Element;
declare namespace SuggestionChipComponent {
    var Label: typeof SuggestionChipLabel;
    var Icon: typeof SuggestionChipIcon;
}
export { SuggestionChipComponent as SuggestionChip };
//# sourceMappingURL=index.d.ts.map
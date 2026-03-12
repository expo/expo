import { type ModifierConfig } from '../../types';
/**
 * Available text style variants for chip labels.
 */
export type ChipTextStyle = 'labelSmall' | 'labelMedium' | 'labelLarge' | 'bodySmall' | 'bodyMedium' | 'bodyLarge';
export type AssistChipProps = {
    /**
     * The text label to display on the chip.
     */
    label: string;
    /**
     * Optional leading icon name (using Material Icons).
     */
    leadingIcon?: string;
    /**
     * Optional trailing icon name (using Material Icons).
     */
    trailingIcon?: string;
    /**
     * Size of the icon in density-independent pixels (dp).
     * @default 18
     */
    iconSize?: number;
    /**
     * Text style variant for the chip label.
     * @default 'labelSmall'
     */
    textStyle?: ChipTextStyle;
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
};
/**
 * An assist chip that helps users complete actions and primary tasks.
 */
export declare function AssistChip(props: AssistChipProps): import("react").JSX.Element;
export type InputChipProps = {
    /**
     * The text label to display on the chip.
     */
    label: string;
    /**
     * Optional leading icon name (using Material Icons), displayed as an avatar.
     */
    leadingIcon?: string;
    /**
     * Optional trailing icon name (using Material Icons). Defaults to `filled.Close` if not specified.
     */
    trailingIcon?: string;
    /**
     * Size of the icon in density-independent pixels (dp).
     * @default 18
     */
    iconSize?: number;
    /**
     * Text style variant for the chip label.
     * @default 'labelSmall'
     */
    textStyle?: ChipTextStyle;
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
};
/**
 * An input chip that represents user input and can be dismissed.
 */
export declare function InputChip(props: InputChipProps): import("react").JSX.Element;
export type SuggestionChipProps = {
    /**
     * The text label to display on the chip.
     */
    label: string;
    /**
     * Optional icon name (using Material Icons).
     */
    leadingIcon?: string;
    /**
     * Size of the icon in density-independent pixels (dp).
     * @default 18
     */
    iconSize?: number;
    /**
     * Text style variant for the chip label.
     * @default 'labelSmall'
     */
    textStyle?: ChipTextStyle;
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
};
/**
 * A suggestion chip that offers contextual suggestions and recommendations.
 */
export declare function SuggestionChip(props: SuggestionChipProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map
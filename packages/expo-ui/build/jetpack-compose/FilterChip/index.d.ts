import { type ModifierConfig } from '../../types';
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
type SlotChildProps = {
    children: React.ReactNode;
};
/**
 * Label slot for FilterChip.
 */
declare function FilterChipLabel(props: SlotChildProps): import("react").JSX.Element;
/**
 * Leading icon slot for FilterChip.
 */
declare function FilterChipLeadingIcon(props: SlotChildProps): import("react").JSX.Element;
/**
 * Trailing icon slot for FilterChip.
 */
declare function FilterChipTrailingIcon(props: SlotChildProps): import("react").JSX.Element;
/**
 * A filter chip component following Material 3 design guidelines.
 * Supports slot-based `Label`, `LeadingIcon`, and `TrailingIcon` children.
 */
declare function FilterChipComponent(props: FilterChipProps): import("react").JSX.Element;
declare namespace FilterChipComponent {
    var Label: typeof FilterChipLabel;
    var LeadingIcon: typeof FilterChipLeadingIcon;
    var TrailingIcon: typeof FilterChipTrailingIcon;
}
export { FilterChipComponent as FilterChip };
//# sourceMappingURL=index.d.ts.map
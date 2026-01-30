import { ExpoModifier } from '../../types';
export type FilterChipProps = {
    /**
     * Whether the chip is currently selected.
     */
    selected: boolean;
    /**
     * The text label to display on the chip.
     */
    label: string;
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
    modifiers?: ExpoModifier[];
    /**
     * Children containing LeadingIcon and TrailingIcon slots.
     */
    children?: React.ReactNode;
};
type SlotChildProps = {
    children: React.ReactNode;
};
/**
 * Leading icon slot for FilterChip.
 */
declare function FilterChipLeadingIcon(props: SlotChildProps): import("react").JSX.Element;
declare namespace FilterChipLeadingIcon {
    var tag: string;
}
/**
 * Trailing icon slot for FilterChip.
 */
declare function FilterChipTrailingIcon(props: SlotChildProps): import("react").JSX.Element;
declare namespace FilterChipTrailingIcon {
    var tag: string;
}
/**
 * A filter chip component following Material 3 design guidelines.
 * Supports slot-based `LeadingIcon` and `TrailingIcon` children.
 */
declare function FilterChipComponent(props: FilterChipProps): import("react").JSX.Element;
declare namespace FilterChipComponent {
    var LeadingIcon: typeof FilterChipLeadingIcon;
    var TrailingIcon: typeof FilterChipTrailingIcon;
}
export { FilterChipComponent as FilterChip };
//# sourceMappingURL=index.d.ts.map
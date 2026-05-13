import type { ColorValue } from 'react-native';
import type { ModifierConfig } from '../../types';
/**
 * Colors for switch core elements.
 */
export type SwitchColors = {
    checkedThumbColor?: ColorValue;
    checkedTrackColor?: ColorValue;
    checkedBorderColor?: ColorValue;
    checkedIconColor?: ColorValue;
    uncheckedThumbColor?: ColorValue;
    uncheckedTrackColor?: ColorValue;
    uncheckedBorderColor?: ColorValue;
    uncheckedIconColor?: ColorValue;
    disabledCheckedThumbColor?: ColorValue;
    disabledCheckedTrackColor?: ColorValue;
    disabledCheckedBorderColor?: ColorValue;
    disabledCheckedIconColor?: ColorValue;
    disabledUncheckedThumbColor?: ColorValue;
    disabledUncheckedTrackColor?: ColorValue;
    disabledUncheckedBorderColor?: ColorValue;
    disabledUncheckedIconColor?: ColorValue;
};
export type SwitchProps = {
    /**
     * Indicates whether the switch is checked.
     */
    value: boolean;
    /**
     * Whether the switch is enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * Callback function that is called when the checked state changes.
     */
    onCheckedChange?: (value: boolean) => void;
    /**
     * Colors for switch core elements.
     */
    colors?: SwitchColors;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Children containing ThumbContent slot.
     * @platform android
     */
    children?: React.ReactNode;
};
type ThumbContentProps = {
    children: React.ReactNode;
};
/**
 * Custom content to be displayed inside the switch thumb.
 * @platform android
 */
export declare function SwitchThumbContent(props: ThumbContentProps): import("react/jsx-runtime").JSX.Element;
/**
 * A switch component.
 */
declare function SwitchComponent(props: SwitchProps): import("react/jsx-runtime").JSX.Element;
declare namespace SwitchComponent {
    var ThumbContent: typeof SwitchThumbContent;
    var DefaultIconSize: any;
}
export { SwitchComponent as Switch };
//# sourceMappingURL=index.d.ts.map
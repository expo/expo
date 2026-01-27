import { type SFSymbol } from 'sf-symbols-typescript';
import { type CommonViewModifierProps } from '../types';
export type ToggleProps = {
    /**
     * A Boolean value that determines the on/off state of the toggle.
     */
    isOn?: boolean;
    /**
     * A string that describes the purpose of the toggle.
     */
    label?: string;
    /**
     * The name of the SF Symbol to display alongside the label.
     */
    systemImage?: SFSymbol;
    /**
     * A callback that is called when the toggle's state changes.
     * @param isOn The new state of the toggle.
     */
    onIsOnChange?: (isOn: boolean) => void;
    /**
     * Custom content for the toggle label. Use multiple `Text` views where
     * the first represents the title and the second represents the subtitle.
     */
    children?: React.ReactNode;
} & CommonViewModifierProps;
/**
 * A control that toggles between on and off states.
 */
export declare function Toggle(props: ToggleProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map
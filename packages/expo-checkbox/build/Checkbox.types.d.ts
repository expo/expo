import { SyntheticEvent } from 'react';
import { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';
export type CheckboxEvent = {
    /**
     * On native platforms, a `NodeHandle` for the element on which the event has occurred.
     * On web, a DOM node on which the event has occurred.
     */
    target: any;
    /**
     * A boolean representing checkbox current value.
     */
    value: boolean;
};
export type CheckboxProps = ViewProps & {
    /**
     * Value indicating if the checkbox should be rendered as checked or not.
     * @default false
     */
    value?: boolean;
    /**
     * If the checkbox is disabled, it becomes opaque and uncheckable.
     */
    disabled?: boolean;
    /**
     * The tint or color of the checkbox. This overrides the disabled opaque style.
     */
    color?: ColorValue;
    /**
     * Callback that is invoked when the user presses the checkbox.
     * @param event A native event containing the checkbox change.
     */
    onChange?: (event: NativeSyntheticEvent<CheckboxEvent> | SyntheticEvent<HTMLInputElement, CheckboxEvent>) => void;
    /**
     * Callback that is invoked when the user presses the checkbox.
     * @param value A boolean indicating the new checked state of the checkbox.
     */
    onValueChange?: (value: boolean) => void;
};
//# sourceMappingURL=Checkbox.types.d.ts.map
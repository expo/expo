import { ColorValue, NativeSyntheticEvent, ViewProps } from 'react-native';
export declare type CheckboxEvent = NativeSyntheticEvent<{
    target: number;
    value: boolean;
}>;
export declare type CheckboxProps = ViewProps & {
    /**
     * Value indicating if the checkbox should be rendered as checked or not. Default value is `false`.
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
    onChange?: (event: CheckboxEvent) => void;
    /**
     * Callback that is invoked when the user presses the checkbox.
     * @param value A boolean indicating the new checked state of the checkbox.
     */
    onValueChange?: (value: boolean) => void;
};
export declare type CheckboxComponent = React.FC<CheckboxProps> & {
    /**
     * @deprecated
     */
    isAvailableAsync: () => Promise<boolean>;
};
//# sourceMappingURL=Checkbox.types.d.ts.map
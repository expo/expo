import { requireNativeView } from 'expo';
const PickerNativeView = requireNativeView('ExpoUI', 'PickerView');
/**
 * @hidden
 */
export function transformPickerProps(props) {
    return {
        ...props,
        variant: props.variant ?? 'segmented',
        elementColors: props.elementColors
            ? props.elementColors
            : props.color
                ? {
                    activeContainerColor: props.color,
                }
                : undefined,
        color: props.color,
    };
}
/**
 * Displays a native picker component. Depending on the variant it can be a segmented button, an inline picker, a list of choices or a radio button.
 */
export function Picker(props) {
    return <PickerNativeView {...transformPickerProps(props)}/>;
}
//# sourceMappingURL=index.js.map
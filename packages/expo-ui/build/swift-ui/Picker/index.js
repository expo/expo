import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const PickerNativeView = requireNativeView('ExpoUI', 'PickerView');
function transformPickerProps(props) {
    const { modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        variant: props.variant ?? 'segmented',
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
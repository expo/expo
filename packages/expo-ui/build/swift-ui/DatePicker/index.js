import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
function transformDateTimePickerProps(props) {
    const { variant, modifiers, ...rest } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...rest,
        onDateSelected: ({ nativeEvent: { date } }) => {
            props?.onDateSelected?.(new Date(date));
        },
        variant,
    };
}
const DatePickerNativeView = requireNativeView('ExpoUI', 'DateTimePickerView');
/**
 * Renders a `DateTimePicker` component.
 */
export function DateTimePicker(props) {
    return <DatePickerNativeView {...transformDateTimePickerProps(props)}/>;
}
//# sourceMappingURL=index.js.map
import { requireNativeView } from 'expo';
import { StyleSheet, PixelRatio } from 'react-native';
/**
 * @hidden
 */
export function transformDateTimePickerProps(props) {
    const { variant, ...rest } = props;
    const { minWidth, minHeight, ...restStyle } = StyleSheet.flatten(rest.style) || {};
    // On Android, the picker’s minWidth and minHeight must be 12dp.
    // Otherwise, the picker will crash the app.
    const minSize = PixelRatio.getPixelSizeForLayoutSize(12);
    // However, when users pass the minWidth and minHeight props, we trust that they know what they are doing.
    const parsedMinWidth = minWidth ? minSize : undefined;
    const parsedMinHeight = minHeight ? minSize : undefined;
    return {
        ...rest,
        onDateSelected: ({ nativeEvent: { date } }) => {
            props?.onDateSelected?.(new Date(date));
        },
        variant,
        // @ts-expect-error
        modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
        style: [restStyle, { minWidth: parsedMinWidth, minHeight: parsedMinHeight }],
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
import { requireNativeView } from 'expo';
import { StyleSheet, PixelRatio } from 'react-native';
import { Host } from '../Host';
/**
 * @hidden
 */
export function transformDateTimePickerProps(props) {
    const { variant, ...rest } = props;
    return {
        ...rest,
        onDateSelected: ({ nativeEvent: { date } }) => {
            props?.onDateSelected?.(new Date(date));
        },
        variant,
    };
}
function transformDateTimePickerStyle(style) {
    const { minWidth, minHeight, ...restStyle } = StyleSheet.flatten(style) || {};
    // On Android, the picker’s minWidth and minHeight must be 12dp.
    // Otherwise, the picker will crash the app.
    const minSize = PixelRatio.getPixelSizeForLayoutSize(12);
    // However, when users pass the minWidth and minHeight props, we trust that they know what they are doing.
    const parsedMinWidth = minWidth ? minSize : undefined;
    const parsedMinHeight = minHeight ? minSize : undefined;
    return [restStyle, { minWidth: parsedMinWidth, minHeight: parsedMinHeight }];
}
const DatePickerNativeView = requireNativeView('ExpoUI', 'DateTimePickerView');
/**
 * `<DateTimePicker>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function DateTimePickerPrimitive(props) {
    return <DatePickerNativeView {...transformDateTimePickerProps(props)}/>;
}
/**
 * Renders a `DateTimePicker` component.
 */
export function DateTimePicker(props) {
    const transformedStyle = transformDateTimePickerStyle(props.style);
    return (<Host style={transformedStyle} matchContents>
      <DateTimePickerPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map
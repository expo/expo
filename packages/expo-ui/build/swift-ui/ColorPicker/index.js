import { requireNativeView } from 'expo';
import { useCallback } from 'react';
import { processColor } from 'react-native';
import { Host } from '../Host';
const ColorPickerNativeView = requireNativeView('ExpoUI', 'ColorPickerView');
/**
 * `<ColorPicker>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function ColorPickerPrimitive({ selection, onValueChanged, ...restProps }) {
    const onNativeValueChanged = useCallback((event) => {
        onValueChanged?.(event.nativeEvent.value);
    }, [onValueChanged]);
    return (<ColorPickerNativeView selection={processColor(selection || '')} onValueChanged={onNativeValueChanged} {...restProps}/>);
}
/**
 * Renders a `ColorPicker` component using SwiftUI.
 * @platform ios
 */
export function ColorPicker(props) {
    return (<Host style={props.style} matchContents>
      <ColorPickerPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map
import { requireNativeView } from 'expo';
import { useCallback } from 'react';
import { processColor } from 'react-native';
const ColorPickerNativeView = requireNativeView('ExpoUI', 'ColorPickerView');
/**
 * Renders a `ColorPicker` component using SwiftUI.
 * @platform ios
 */
export function ColorPicker({ selection, onValueChanged, ...restProps }) {
    const onNativeValueChanged = useCallback((event) => {
        onValueChanged?.(event.nativeEvent.value);
    }, [onValueChanged]);
    return (<ColorPickerNativeView selection={processColor(selection || '')} onValueChanged={onNativeValueChanged} {...restProps}/>);
}
//# sourceMappingURL=index.js.map
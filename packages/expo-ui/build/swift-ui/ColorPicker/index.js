import { requireNativeView } from 'expo';
import { useCallback } from 'react';
import { processColor } from 'react-native';
import { createViewModifierEventListener } from '../modifiers/utils';
const ColorPickerNativeView = requireNativeView('ExpoUI', 'ColorPickerView');
/**
 * Renders a `ColorPicker` component using SwiftUI.
 * @platform ios
 */
export function ColorPicker({ selection, onValueChanged, modifiers, ...restProps }) {
    const onNativeValueChanged = useCallback((event) => {
        onValueChanged?.(event.nativeEvent.value);
    }, [onValueChanged]);
    return (<ColorPickerNativeView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} selection={processColor(selection || '')} onValueChanged={onNativeValueChanged} {...restProps}/>);
}
//# sourceMappingURL=index.js.map
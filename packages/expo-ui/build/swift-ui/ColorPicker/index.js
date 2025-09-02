import { requireNativeView } from 'expo';
import { useCallback } from 'react';
import { processColor } from 'react-native';
import { createViewModifierEventListener } from '../modifiers/utils';
import { MissingHostErrorView, isMissingHost } from '../Host';
const ColorPickerNativeView = requireNativeView('ExpoUI', 'ColorPickerView');
/**
 * Renders a `ColorPicker` component using SwiftUI.
 * @platform ios
 */
export function ColorPicker({ selection, onValueChanged, modifiers, ...restProps }) {
    const onNativeValueChanged = useCallback((event) => {
        onValueChanged?.(event.nativeEvent.value);
    }, [onValueChanged]);
    if (isMissingHost(restProps)) {
        return <MissingHostErrorView componentName="ColorPicker"/>;
    }
    return (<ColorPickerNativeView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} selection={processColor(selection || '')} onValueChanged={onNativeValueChanged} {...restProps}/>);
}
//# sourceMappingURL=index.js.map
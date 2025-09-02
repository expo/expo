import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
// We have to work around the `role` and `onPress` props being reserved by React Native.
const TextFieldNativeView = requireNativeView('ExpoUI', 'TextFieldView');
function transformTextFieldProps(props) {
    const { modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        onValueChanged: (event) => {
            props.onChangeText?.(event.nativeEvent.value);
        },
    };
}
/**
 * Renders a `TextField` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export function TextField(props) {
    return <TextFieldNativeView {...transformTextFieldProps(props)}/>;
}
//# sourceMappingURL=index.js.map
import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
// We have to work around the `role` and `onPress` props being reserved by React Native.
const SecureFieldNativeView = requireNativeView('ExpoUI', 'SecureFieldView');
function transformSecureFieldProps(props) {
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
 * Renders a `SecureField` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export function SecureField(props) {
    return <SecureFieldNativeView {...transformSecureFieldProps(props)}/>;
}
//# sourceMappingURL=index.js.map
import { requireNativeView } from 'expo';
import { Host } from '../Host';
// We have to work around the `role` and `onPress` props being reserved by React Native.
const SecureFieldNativeView = requireNativeView('ExpoUI', 'SecureFieldView');
/**
 * @hidden
 */
function transformSecureFieldProps(props) {
    return {
        ...props,
        onValueChanged: (event) => {
            props.onChangeText?.(event.nativeEvent.value);
        },
    };
}
/**
 * Renders a `SecureField` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export function SecureField(props) {
    return (<Host style={props.style} matchContents>
      <SecureFieldPrimitive {...props}/>
    </Host>);
}
/**
 * `<SecureField>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function SecureFieldPrimitive(props) {
    return <SecureFieldNativeView {...transformSecureFieldProps(props)}/>;
}
//# sourceMappingURL=index.js.map
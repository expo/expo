import { requireNativeView } from 'expo';
import { Host } from '../Host';
// We have to work around the `role` and `onPress` props being reserved by React Native.
const TextFieldNativeView = requireNativeView('ExpoUI', 'TextFieldView');
/**
 * @hidden
 */
function transformTextFieldProps(props) {
    return {
        ...props,
        onValueChanged: (event) => {
            props.onChangeText?.(event.nativeEvent.value);
        },
    };
}
/**
 * Renders a `TextField` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export function TextField(props) {
    return (<Host style={props.style} matchContents>
      <TextFieldPrimitive {...props}/>
    </Host>);
}
/**
 * `<TextField>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function TextFieldPrimitive(props) {
    return <TextFieldNativeView {...transformTextFieldProps(props)}/>;
}
//# sourceMappingURL=index.js.map
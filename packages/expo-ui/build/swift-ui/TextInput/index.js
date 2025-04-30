import { requireNativeView } from 'expo';
import { Host } from '../Host';
// We have to work around the `role` and `onPress` props being reserved by React Native.
const TextInputNativeView = requireNativeView('ExpoUI', 'TextInputView');
/**
 * @hidden
 */
function transformTextInputProps(props) {
    return {
        ...props,
        onValueChanged: (event) => {
            props.onChangeText?.(event.nativeEvent.value);
        },
    };
}
/**
 * Renders a `TextInput` component. Should mostly be used for embedding text inputs inside of SwiftUI lists and sections. Is an uncontrolled component.
 */
export function TextInput(props) {
    return (<Host style={props.style} matchContents>
      <TextInputPrimitive {...props}/>
    </Host>);
}
/**
 * `<TextInput>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function TextInputPrimitive(props) {
    return <TextInputNativeView {...transformTextInputProps(props)}/>;
}
//# sourceMappingURL=index.js.map
import { requireNativeView } from 'expo';
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
 * Renders a `TextInput` component.
 */
export function TextInput(props) {
    return <TextInputNativeView {...transformTextInputProps(props)} style={props.style}/>;
}
//# sourceMappingURL=index.js.map
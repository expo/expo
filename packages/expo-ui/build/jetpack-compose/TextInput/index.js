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
        // @ts-expect-error
        modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
    };
}
/**
 * Renders a `TextInput` component.
 */
export function TextInput(props) {
    return <TextInputNativeView {...transformTextInputProps(props)} style={props.style}/>;
}
//# sourceMappingURL=index.js.map
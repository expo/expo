import { requireNativeView } from 'expo';
// We have to work around the `role` and `onPress` props being reserved by React Native.
const ButtonNativeView = requireNativeView('ExpoUI', 'Button');
/**
 * @hidden
 */
export function transformButtonProps(props) {
    const { role, children, onPress, systemImage, ...restProps } = props;
    return {
        ...restProps,
        text: children ?? '',
        buttonRole: role,
        systemImage,
        onButtonPressed: onPress,
    };
}
/**
 * Displays a native button component.
 */
export function Button(props) {
    return <ButtonNativeView {...transformButtonProps(props)} style={props.style}/>;
}
//# sourceMappingURL=index.js.map
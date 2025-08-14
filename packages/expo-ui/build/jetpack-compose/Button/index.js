import { requireNativeView } from 'expo';
import { StyleSheet } from 'react-native';
// We have to work around the `role` and `onPress` props being reserved by React Native.
const ButtonNativeView = requireNativeView('ExpoUI', 'Button');
/**
 * @hidden
 */
export function transformButtonProps(props) {
    const { children, onPress, systemImage, ...restProps } = props;
    return {
        ...restProps,
        text: children ?? '',
        systemImage,
        onButtonPressed: onPress,
        // @ts-expect-error
        modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
        elementColors: props.elementColors
            ? props.elementColors
            : props.color
                ? {
                    containerColor: props.color,
                }
                : undefined,
    };
}
/**
 * Displays a native button component.
 */
export function Button(props) {
    // Min height from https://m3.material.io/components/buttons/specs, minWidth
    return (<ButtonNativeView {...transformButtonProps(props)} style={StyleSheet.compose({ minWidth: 80, minHeight: 40 }, props.style)}/>);
}
//# sourceMappingURL=index.js.map
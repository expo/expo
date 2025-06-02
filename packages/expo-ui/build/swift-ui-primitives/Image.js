import { requireNativeView } from 'expo';
function transformNativeProps(props) {
    const { onPress, ...restProps } = props;
    return {
        ...restProps,
        ...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null),
    };
}
const ImageNativeView = requireNativeView('ExpoUI', 'ImageView');
export function Image(props) {
    return <ImageNativeView {...transformNativeProps(props)}/>;
}
//# sourceMappingURL=Image.js.map
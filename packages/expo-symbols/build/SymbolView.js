import { Platform, requireNativeViewManager } from 'expo-modules-core';
import { processColor } from 'react-native';
let NativeView = null;
if (Platform.OS === 'ios') {
    NativeView = requireNativeViewManager('SymbolModule');
}
export function SymbolView(props) {
    if (!NativeView) {
        return <>{props.fallback}</>;
    }
    const nativeProps = getNativeProps(props);
    return <NativeView {...nativeProps}/>;
}
function getNativeProps(props) {
    const colors = Array.isArray(props.colors) ? props.colors : props.colors ? [props.colors] : [];
    const animated = !!props.animationSpec || false;
    const type = props.type || 'monochrome';
    const size = props.size || 24;
    const style = props.style
        ? [{ width: size, height: size }, props.style]
        : { width: size, height: size };
    return {
        ...props,
        style,
        colors: colors.map((c) => processColor(c)),
        tint: processColor(props.tintColor),
        animated,
        type,
    };
}
//# sourceMappingURL=SymbolView.js.map
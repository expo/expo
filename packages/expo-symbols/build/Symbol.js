import { Platform, requireNativeViewManager } from 'expo-modules-core';
const NativeView = requireNativeViewManager('SymbolModule');
export function Symbol(props) {
    if (Platform.OS === 'android') {
        return <>{props.fallback}</>;
    }
    const nativeProps = getNativeProps(props);
    return <NativeView {...nativeProps}/>;
}
function getNativeProps(props) {
    const colors = Array.isArray(props.colors) ? props.colors : props.colors ? [props.colors] : [];
    const animated = !!props.animationSpec || false;
    const type = props.type || 'monochrome';
    return {
        ...props,
        colors,
        animated,
        type,
    };
}
//# sourceMappingURL=Symbol.js.map
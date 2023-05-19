import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { defaultCSSInterop } from '../native/css-interop';
import { polyfillMapping } from './mapping';
export { defaultCSSInterop };
export function makeStyled(component, interop = defaultCSSInterop) {
    polyfillMapping.set(component, interop);
}
makeStyled(Animated.Text);
makeStyled(Animated.View);
makeStyled(Pressable);
makeStyled(Text);
makeStyled(View);
/**
 * The SvgCSSInterop utilises the defaultCSSInterop to transform the `style` prop.
 * Once transformed, the `fill` and `stroke` style attributes are removed and added to the `props` object
 */
export function svgCSSInterop(jsx, type, props, key, experimentalFeatures) {
    function svgInterop(type, { style, ...$props }, key) {
        if (style.fill !== undefined) {
            $props.fill = style.fill;
            delete style.fill;
        }
        if (style.stroke !== undefined) {
            $props.stroke = style.stroke;
            delete style.stroke;
        }
        return jsx(type, { ...$props, style }, key);
    }
    return defaultCSSInterop(svgInterop, type, props, key, experimentalFeatures);
}
//# sourceMappingURL=index.native.js.map
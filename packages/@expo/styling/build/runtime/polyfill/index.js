import { View, Text, Pressable } from 'react-native';
import { defaultCSSInterop } from '../web/css-interop';
import { polyfillMapping } from './mapping';
export { defaultCSSInterop };
export function makeStyled(component, interop = defaultCSSInterop) {
    polyfillMapping.set(component, interop);
}
makeStyled(View);
makeStyled(Pressable);
makeStyled(Text);
export const svgCSSInterop = defaultCSSInterop;
//# sourceMappingURL=index.js.map
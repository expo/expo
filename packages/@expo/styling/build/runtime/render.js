import { polyfillMapping } from './polyfill/mapping';
export function render(jsx, type, props, key, experimental = false) {
    const cssInterop = polyfillMapping.get(type);
    if (cssInterop && !props.__skipCssInterop) {
        return cssInterop(jsx, type, props, key, experimental);
    }
    else {
        return jsx(type, props, key);
    }
}
//# sourceMappingURL=render.js.map
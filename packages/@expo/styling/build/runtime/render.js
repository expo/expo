"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = void 0;
const mapping_1 = require("./polyfill/mapping");
function render(jsx, type, props, key, experimentalFeatures = false) {
    const cssInterop = mapping_1.polyfillMapping.get(type);
    if (cssInterop && !props.__skipCssInterop) {
        return cssInterop(jsx, type, props, key, experimentalFeatures);
    }
    else {
        return jsx(type, props, key);
    }
}
exports.render = render;
//# sourceMappingURL=render.js.map
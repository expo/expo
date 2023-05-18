"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.svgCSSInterop = exports.makeStyled = exports.defaultCSSInterop = void 0;
const react_native_1 = require("react-native");
const css_interop_1 = require("../web/css-interop");
Object.defineProperty(exports, "defaultCSSInterop", { enumerable: true, get: function () { return css_interop_1.defaultCSSInterop; } });
const mapping_1 = require("./mapping");
function makeStyled(component, interop = css_interop_1.defaultCSSInterop) {
    mapping_1.polyfillMapping.set(component, interop);
}
exports.makeStyled = makeStyled;
makeStyled(react_native_1.View);
makeStyled(react_native_1.Pressable);
makeStyled(react_native_1.Text);
exports.svgCSSInterop = css_interop_1.defaultCSSInterop;
//# sourceMappingURL=index.js.map
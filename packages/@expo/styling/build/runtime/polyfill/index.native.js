"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.svgCSSInterop = exports.makeStyled = exports.defaultCSSInterop = void 0;
const react_native_1 = require("react-native");
const react_native_reanimated_1 = __importDefault(require("react-native-reanimated"));
const css_interop_1 = require("../native/css-interop");
Object.defineProperty(exports, "defaultCSSInterop", { enumerable: true, get: function () { return css_interop_1.defaultCSSInterop; } });
const mapping_1 = require("./mapping");
function makeStyled(component, interop = css_interop_1.defaultCSSInterop) {
    mapping_1.polyfillMapping.set(component, interop);
}
exports.makeStyled = makeStyled;
makeStyled(react_native_reanimated_1.default.Text);
makeStyled(react_native_reanimated_1.default.View);
makeStyled(react_native_1.Pressable);
makeStyled(react_native_1.Text);
makeStyled(react_native_1.View);
/**
 * The SvgCSSInterop utilises the defaultCSSInterop to transform the `style` prop.
 * Once transformed, the `fill` and `stroke` style attributes are removed and added to the `props` object
 */
function svgCSSInterop(jsx, type, props, key, experimentalFeatures) {
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
    return (0, css_interop_1.defaultCSSInterop)(svgInterop, type, props, key, experimentalFeatures);
}
exports.svgCSSInterop = svgCSSInterop;
//# sourceMappingURL=index.native.js.map
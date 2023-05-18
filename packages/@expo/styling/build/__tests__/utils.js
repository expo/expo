"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockComponent = exports.registerCSS = void 0;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const css_to_rn_1 = require("../css-to-rn");
const css_interop_1 = require("../runtime/native/css-interop");
const stylesheet_1 = require("../runtime/native/stylesheet");
function registerCSS(css, options) {
    stylesheet_1.StyleSheet.register((0, css_to_rn_1.cssToReactNativeRuntime)(Buffer.from(css), options));
}
exports.registerCSS = registerCSS;
function createMockComponent(Component = react_native_1.View) {
    const component = Object.assign(jest.fn((props, ref) => react_1.default.createElement(Component, { ref: ref, ...props })));
    const b = react_1.default.forwardRef(component);
    const componentWithRef = react_1.default.forwardRef((props, ref) => {
        return (0, css_interop_1.defaultCSSInterop)((ComponentType, props, key) => {
            return react_1.default.createElement(ComponentType, { ref: ref, ...props, key: key });
        }, b, props, "key", true);
    });
    Object.assign(componentWithRef, {
        component,
    });
    return componentWithRef;
}
exports.createMockComponent = createMockComponent;
//# sourceMappingURL=utils.js.map
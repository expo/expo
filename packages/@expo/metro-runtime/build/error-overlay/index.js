"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withErrorOverlay = void 0;
const react_1 = __importDefault(require("react"));
// TODO: This will break tree shaking due to how we transpile this package.
const react_native_1 = require("react-native");
const ErrorToastContainer_1 = __importDefault(require("./toast/ErrorToastContainer"));
if (!global.setImmediate) {
    global.setImmediate = function (fn) {
        return setTimeout(fn, 0);
    };
}
if (process.env.NODE_ENV === 'development') {
    if (react_native_1.Platform.OS === 'web') {
        // Stack traces are big with React Navigation
        require('./LogBox').default.install();
    }
}
function withErrorOverlay(Comp) {
    if (process.env.NODE_ENV === 'production') {
        return Comp;
    }
    return function ErrorOverlay(props) {
        return (react_1.default.createElement(ErrorToastContainer_1.default, null,
            react_1.default.createElement(Comp, { ...props })));
    };
}
exports.withErrorOverlay = withErrorOverlay;
//# sourceMappingURL=index.js.map
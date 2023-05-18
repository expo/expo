"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createElement = exports.svgCSSInterop = exports.makeStyled = exports.defaultCSSInterop = exports.StyleSheet = void 0;
const react_1 = __importDefault(require("react"));
var react_native_1 = require("react-native");
Object.defineProperty(exports, "StyleSheet", { enumerable: true, get: function () { return react_native_1.StyleSheet; } });
var polyfill_1 = require("./runtime/polyfill");
Object.defineProperty(exports, "defaultCSSInterop", { enumerable: true, get: function () { return polyfill_1.defaultCSSInterop; } });
Object.defineProperty(exports, "makeStyled", { enumerable: true, get: function () { return polyfill_1.makeStyled; } });
Object.defineProperty(exports, "svgCSSInterop", { enumerable: true, get: function () { return polyfill_1.svgCSSInterop; } });
exports.createElement = react_1.default.createElement;
//# sourceMappingURL=index.js.map
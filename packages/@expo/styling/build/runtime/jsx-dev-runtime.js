"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsxs = exports.jsx = exports.Fragment = void 0;
const react_1 = __importDefault(require("react"));
const jsx_dev_runtime_1 = __importDefault(require("react/jsx-dev-runtime"));
const render_1 = require("./render");
exports.Fragment = react_1.default.Fragment;
function jsx(type, props, key) {
    return (0, render_1.render)(jsx_dev_runtime_1.default.jsx, type, props, key);
}
exports.jsx = jsx;
function jsxs(type, props, key) {
    return (0, render_1.render)(jsx_dev_runtime_1.default.jsxs, type, props, key);
}
exports.jsxs = jsxs;
//# sourceMappingURL=jsx-dev-runtime.js.map
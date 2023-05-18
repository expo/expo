"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const globals_1 = require("../runtime/native/globals");
const stylesheet_1 = require("../runtime/native/stylesheet");
const utils_1 = require("./utils");
const A = (0, utils_1.createMockComponent)();
afterEach(() => {
    stylesheet_1.StyleSheet.__reset();
});
test("px", () => {
    (0, utils_1.registerCSS)(`.my-class { width: 10px; }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        width: 10,
    });
});
test("%", () => {
    (0, utils_1.registerCSS)(`.my-class { width: 10%; }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        width: "10%",
    });
});
test("vw", () => {
    (0, utils_1.registerCSS)(`.my-class { width: 10vw; }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(globals_1.vw.get()).toEqual(750);
    expect(A).styleToEqual({
        width: 75,
    });
    (0, react_native_1.act)(() => {
        globals_1.vw.__set(100);
    });
    expect(globals_1.vw.get()).toEqual(100);
    expect(A).styleToEqual({ width: 10 });
});
test("vh", () => {
    (0, utils_1.registerCSS)(`.my-class { height: 10vh; }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(globals_1.vh.get()).toEqual(1334);
    expect(A).styleToEqual({ height: 133.4 });
    (0, react_native_1.act)(() => {
        globals_1.vh.__set(100);
    });
    expect(globals_1.vh.get()).toEqual(100);
    expect(A).styleToEqual({ height: 10 });
});
test("rem - default", () => {
    (0, utils_1.registerCSS)(`.my-class { fontSize: 10rem; }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({ fontSize: 140 });
});
test("rem - override", () => {
    (0, utils_1.registerCSS)(`.my-class { fontSize: 10rem; }`, {
        inlineRem: 10,
    });
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({ fontSize: 100 });
});
test("rem - dynamic", () => {
    (0, utils_1.registerCSS)(`.my-class { fontSize: 10rem; }`, {
        inlineRem: false,
    });
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(globals_1.rem.get()).toEqual(14);
    expect(A).styleToEqual({ fontSize: 140 });
    (0, react_native_1.act)(() => {
        globals_1.rem.set(10);
    });
    expect(globals_1.rem.get()).toEqual(10);
    expect(A).styleToEqual({ fontSize: 100 });
});
//# sourceMappingURL=units.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const utils_1 = require("./utils");
const globals_1 = require("../runtime/native/globals");
const stylesheet_1 = require("../runtime/native/stylesheet");
const A = (0, utils_1.createMockComponent)();
beforeEach(() => {
    stylesheet_1.StyleSheet.__reset();
});
test("color scheme", () => {
    (0, utils_1.registerCSS)(`
.my-class { color: blue; }

@media (prefers-color-scheme: dark) {
  .my-class { color: red; }
}`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        color: "rgba(0, 0, 255, 1)",
    });
    (0, react_native_1.act)(() => {
        globals_1.colorScheme.set("dark");
    });
    expect(A).styleToEqual({
        color: "rgba(255, 0, 0, 1)",
    });
});
test("prefers-reduced-motion", () => {
    (0, utils_1.registerCSS)(`
    .my-class { color: blue; }

    @media (prefers-reduced-motion) {
      .my-class { color: red; }
    }
  `);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        color: "rgba(0, 0, 255, 1)",
    });
    (0, react_native_1.act)(() => {
        globals_1.isReduceMotionEnabled.set(true);
    });
    expect(A).styleToEqual({
        color: "rgba(255, 0, 0, 1)",
    });
});
test("width (plain)", () => {
    (0, utils_1.registerCSS)(`
.my-class { color: blue; }

@media (width: 500px) {
  .my-class { color: red; }
}`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        color: "rgba(0, 0, 255, 1)",
    });
    (0, react_native_1.act)(() => {
        globals_1.vw.__set(500);
    });
    expect(A).styleToEqual({
        color: "rgba(255, 0, 0, 1)",
    });
});
test("width (range)", () => {
    (0, utils_1.registerCSS)(`
.my-class { color: blue; }

@media (width = 500px) {
  .my-class { color: red; }
}`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        color: "rgba(0, 0, 255, 1)",
    });
    (0, react_native_1.act)(() => {
        globals_1.vw.__set(500);
    });
    expect(A).styleToEqual({
        color: "rgba(255, 0, 0, 1)",
    });
});
test("min-width", () => {
    (0, utils_1.registerCSS)(`
.my-class { color: blue; }

@media (min-width: 500px) {
  .my-class { color: red; }
}`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        color: "rgba(255, 0, 0, 1)",
    });
    (0, react_native_1.act)(() => {
        globals_1.vw.__set(300);
    });
    expect(A).styleToEqual({
        color: "rgba(0, 0, 255, 1)",
    });
});
test("max-width", () => {
    (0, utils_1.registerCSS)(`
.my-class { color: blue; }

@media (max-width: 500px) {
  .my-class { color: red; }
}`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        color: "rgba(0, 0, 255, 1)",
    });
    (0, react_native_1.act)(() => {
        globals_1.vw.__set(300);
    });
    expect(A).styleToEqual({
        color: "rgba(255, 0, 0, 1)",
    });
});
//# sourceMappingURL=media-query.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/*
 * These tests simple smoke tests to ensure the core functionality is met.
 * If you need to go into more detail, create a new test file
 *
 * https://en.wikipedia.org/wiki/Smoke_testing_(software)
 */
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const stylesheet_1 = require("../runtime/native/stylesheet");
const utils_1 = require("./utils");
const A = (0, utils_1.createMockComponent)();
afterEach(() => {
    stylesheet_1.StyleSheet.__reset();
});
const cases = {
    color: ["red", { color: "rgba(255, 0, 0, 1)" }],
    "background-color": ["purple", { backgroundColor: "rgba(128, 0, 128, 1)" }],
};
test.each(Object.entries(cases))("%s", (key, [css, expected]) => {
    (0, utils_1.registerCSS)(`.my-class { ${key}: ${css} }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual(expected);
});
//# sourceMappingURL=smoke.test.js.map
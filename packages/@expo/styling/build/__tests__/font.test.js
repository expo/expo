"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const utils_1 = require("./utils");
const stylesheet_1 = require("../runtime/native/stylesheet");
const A = (0, utils_1.createMockComponent)();
afterEach(() => {
    stylesheet_1.StyleSheet.__reset();
});
test("heading", () => {
    (0, utils_1.registerCSS)(`.my-class { 
font-size: 3rem;
line-height: 1;
}`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        fontSize: 42,
        lineHeight: 42,
    });
});
//# sourceMappingURL=font.test.js.map
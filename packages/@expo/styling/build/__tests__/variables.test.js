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
test("inline variable", () => {
    (0, utils_1.registerCSS)(`.my-class { width: var(--my-var); --my-var: 10px; }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        width: 10,
    });
});
test("combined inline variable", () => {
    (0, utils_1.registerCSS)(`
    .my-class-1 { width: var(--my-var); }
    .my-class-2 { --my-var: 10px; }
    .my-class-3 { --my-var: 20px; }
  `);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class-1 my-class-2" }));
    expect(A).styleToEqual({
        width: 10,
    });
    // Prove that the order doesn't matter
    react_native_1.screen.rerender(react_1.default.createElement(A, { className: "my-class-3 my-class-1" }));
    expect(A).styleToEqual({
        width: 20,
    });
});
test("inherit variables", () => {
    const B = (0, utils_1.createMockComponent)();
    (0, utils_1.registerCSS)(`
    .my-class-1 { width: var(--my-var); }
    .my-class-2 { --my-var: 10px; }
    .my-class-3 { --my-var: 20px; }
  `);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class-2" },
        react_1.default.createElement(B, { className: "my-class-1" })));
    expect(A).styleToEqual({});
    expect(B).styleToEqual({ width: 10 });
    react_native_1.screen.rerender(react_1.default.createElement(A, { className: "my-class-3" },
        react_1.default.createElement(B, { className: "my-class-1" })));
    expect(A).styleToEqual({});
    expect(B).styleToEqual({ width: 20 });
});
//# sourceMappingURL=variables.test.js.map
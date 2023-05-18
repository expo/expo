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
test("hover", () => {
    (0, utils_1.registerCSS)(`.my-class:hover { width: 10px; }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { testID: "a", className: "my-class" }));
    expect(A).styleToEqual({});
    (0, react_native_1.act)(() => (0, react_native_1.fireEvent)(react_native_1.screen.getByTestId("a"), "hoverIn", {}));
    expect(A).styleToEqual({ width: 10 });
    (0, react_native_1.act)(() => (0, react_native_1.fireEvent)(react_native_1.screen.getByTestId("a"), "hoverOut", {}));
    expect(A).styleToEqual({});
});
test("active", () => {
    (0, utils_1.registerCSS)(`.my-class:active { width: 10px; }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { testID: "a", className: "my-class" }));
    expect(A).styleToEqual({});
    (0, react_native_1.act)(() => (0, react_native_1.fireEvent)(react_native_1.screen.getByTestId("a"), "PressIn", {}));
    expect(A).styleToEqual({ width: 10 });
    (0, react_native_1.act)(() => (0, react_native_1.fireEvent)(react_native_1.screen.getByTestId("a"), "PressOut", {}));
    expect(A).styleToEqual({});
});
test("focus", () => {
    (0, utils_1.registerCSS)(`.my-class:focus { width: 10px; }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { testID: "a", className: "my-class" }));
    expect(A).styleToEqual({});
    (0, react_native_1.act)(() => (0, react_native_1.fireEvent)(react_native_1.screen.getByTestId("a"), "Focus", {}));
    expect(A).styleToEqual({ width: 10 });
    (0, react_native_1.act)(() => (0, react_native_1.fireEvent)(react_native_1.screen.getByTestId("a"), "Blur", {}));
    expect(A).styleToEqual({});
});
test(":hover:active:focus", () => {
    (0, utils_1.registerCSS)(`.my-class:hover:active:focus { width: 10px; }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { testID: "a", className: "my-class" }));
    expect(A).styleToEqual({});
    (0, react_native_1.act)(() => {
        (0, react_native_1.fireEvent)(react_native_1.screen.getByTestId("a"), "hoverIn", {});
    });
    expect(A).styleToEqual({});
    (0, react_native_1.act)(() => {
        (0, react_native_1.fireEvent)(react_native_1.screen.getByTestId("a"), "PressIn", {});
    });
    expect(A).styleToEqual({});
    (0, react_native_1.act)(() => {
        (0, react_native_1.fireEvent)(react_native_1.screen.getByTestId("a"), "focus", {});
    });
    expect(A).styleToEqual({ width: 10 });
    (0, react_native_1.act)(() => (0, react_native_1.fireEvent)(react_native_1.screen.getByTestId("a"), "hoverOut", {}));
    expect(A).styleToEqual({});
});
//# sourceMappingURL=pseudo-classes.js.map
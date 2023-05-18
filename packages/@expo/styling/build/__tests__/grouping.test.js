"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const stylesheet_1 = require("../runtime/native/stylesheet");
const utils_1 = require("./utils");
afterEach(() => {
    stylesheet_1.StyleSheet.__reset();
});
test("group", async () => {
    const A = (0, utils_1.createMockComponent)();
    const B = (0, utils_1.createMockComponent)();
    (0, utils_1.registerCSS)(`.group\\/item .my-class { 
      color: red;
    }`, {
        grouping: ["^group\\/.*"],
    });
    const { rerender } = (0, react_native_1.render)(react_1.default.createElement(B, { className: "my-class" }));
    expect(B).styleToEqual({});
    rerender(react_1.default.createElement(A, { testID: "A", className: "group/item" },
        react_1.default.createElement(B, { testID: "B", className: "my-class" })));
    expect(B).styleToEqual({ color: "rgba(255, 0, 0, 1)" });
});
test("invalid group", async () => {
    const A = (0, utils_1.createMockComponent)();
    const B = (0, utils_1.createMockComponent)();
    (0, utils_1.registerCSS)(`.invalid .my-class { 
      color: red;
    }`, {
        grouping: ["^group\\/.*"],
    });
    const { rerender } = (0, react_native_1.render)(react_1.default.createElement(B, { className: "my-class" }));
    expect(B).styleToEqual(undefined);
    rerender(react_1.default.createElement(A, { testID: "A", className: "invalid" },
        react_1.default.createElement(B, { className: "my-class" })));
    expect(B).styleToEqual(undefined);
});
//# sourceMappingURL=grouping.test.js.map
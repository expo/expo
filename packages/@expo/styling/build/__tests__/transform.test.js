"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const stylesheet_1 = require("../runtime/native/stylesheet");
const utils_1 = require("./utils");
const A = (0, utils_1.createMockComponent)();
afterEach(() => {
    stylesheet_1.StyleSheet.__reset();
});
test("translateX percentage", () => {
    (0, utils_1.registerCSS)(`.my-class { width: 120px; transform: translateX(10%); }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        width: 120,
        transform: [{ translateX: 12 }],
    });
});
test("translateY percentage", () => {
    (0, utils_1.registerCSS)(`.my-class { height: 120px; transform: translateY(10%); }`);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "my-class" }));
    expect(A).styleToEqual({
        height: 120,
        transform: [{ translateY: 12 }],
    });
});
test("rotate-180", () => {
    (0, utils_1.registerCSS)(`
    .rotate-180 {
      --tw-rotate: 180deg;
      transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
    }
  `);
    (0, react_native_1.render)(react_1.default.createElement(A, { className: "rotate-180" }));
    expect(A).styleToEqual({
        transform: [
            {
                translateX: 0,
            },
            {
                rotate: "180deg",
            },
            {
                skewX: "0deg",
            },
            {
                skewY: "0deg",
            },
            {
                scaleX: 1,
            },
            {
                scaleY: 1,
            },
        ],
    });
});
//# sourceMappingURL=transform.test.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const stylesheet_1 = require("../runtime/native/stylesheet");
const utils_1 = require("./utils");
const Parent = (0, utils_1.createMockComponent)();
const Child = (0, utils_1.createMockComponent)();
beforeEach(() => {
    stylesheet_1.StyleSheet.__reset();
});
describe("size", () => {
    test("width", async () => {
        (0, utils_1.registerCSS)(`
      .container { 
        container-name: test; 
        width: 200px;
      }

      .child {
        color: red;
      }

      @container (width > 400px) {
        .child {
          color: blue;
        }
      }
    `);
        const { rerender } = (0, react_native_1.render)(react_1.default.createElement(Parent, { testID: "parent", className: "container" },
            react_1.default.createElement(Child, { className: "child" })));
        const parent = await react_native_1.screen.findByTestId("parent");
        expect(Parent).styleToEqual({
            width: 200,
        });
        expect(Child).styleToEqual({
            color: "rgba(255, 0, 0, 1)",
        });
        (0, react_native_1.fireEvent)(parent, "layout", {
            nativeEvent: {
                layout: {
                    width: 200,
                    height: 200,
                },
            },
        });
        expect(Child).styleToEqual({
            color: "rgba(255, 0, 0, 1)",
        });
        rerender(react_1.default.createElement(Parent, { className: "container", style: { width: 500 } },
            react_1.default.createElement(Child, { className: "child" })));
        (0, react_native_1.fireEvent)(parent, "layout", {
            nativeEvent: {
                layout: {
                    width: 500,
                    height: 200,
                },
            },
        });
        expect(Parent).styleToEqual({
            width: 500,
        });
        expect(Child).styleToEqual({
            color: "rgba(0, 0, 255, 1)",
        });
    });
});
//# sourceMappingURL=container-queries.test.js.map
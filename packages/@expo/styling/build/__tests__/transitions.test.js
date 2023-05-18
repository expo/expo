"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const react_native_2 = require("react-native");
// import Animated from "react-native-reanimated";
const stylesheet_1 = require("../runtime/native/stylesheet");
const utils_1 = require("./utils");
const A = (0, utils_1.createMockComponent)(react_native_2.View);
jest.useFakeTimers();
beforeEach(() => {
    stylesheet_1.StyleSheet.__reset();
});
test("numeric transition", () => {
    (0, utils_1.registerCSS)(`
    .transition {
      transition: width 1s;
    }

    .first {
      width: 100px;
    }

    .second {
      width: 200px;
    }
`);
    const { rerender, getByTestId } = (0, react_native_1.render)(react_1.default.createElement(A, { testID: "test", className: "transition first" }));
    const testComponent = getByTestId("test");
    // Should have a static width, no matter the time
    expect(testComponent).toHaveAnimatedStyle({
        width: 100,
    });
    jest.advanceTimersByTime(1000);
    expect(testComponent).toHaveAnimatedStyle({
        width: 100,
    });
    rerender(react_1.default.createElement(A, { testID: "test", className: "transition second" }));
    // Directly after rerender, should still have the old width
    expect(testComponent).toHaveAnimatedStyle({
        width: 100,
    });
    // Width should only change after we advance time
    jest.advanceTimersByTime(500);
    expect(testComponent).toHaveAnimatedStyle({
        width: 150,
    });
    // At the end of the transition
    jest.advanceTimersByTime(500);
    expect(testComponent).toHaveAnimatedStyle({
        width: 200,
    });
    // Width should not change after the transition is done
    jest.advanceTimersByTime(500);
    expect(testComponent).toHaveAnimatedStyle({
        width: 200,
    });
});
test("color transition", () => {
    (0, utils_1.registerCSS)(`
    .transition {
      transition: color 1s;
    }

    .first {
      color: red;
    }

    .second {
      color: blue;
    }
`);
    const { rerender, getByTestId } = (0, react_native_1.render)(react_1.default.createElement(A, { testID: "test", className: "transition first" }));
    const testComponent = getByTestId("test");
    // Should have a static width, no matter the time
    expect(testComponent).toHaveAnimatedStyle({
        color: "rgba(255, 0, 0, 1)",
    });
    jest.advanceTimersByTime(1000);
    expect(testComponent).toHaveAnimatedStyle({
        color: "rgba(255, 0, 0, 1)",
    });
    rerender(react_1.default.createElement(A, { testID: "test", className: "transition second" }));
    // Directly after rerender, should still have the old width
    expect(testComponent).toHaveAnimatedStyle({
        color: "rgba(255, 0, 0, 1)",
    });
    // Width should only change after we advance time
    jest.advanceTimersByTime(500);
    expect(testComponent).toHaveAnimatedStyle({
        color: "rgba(186, 0, 186, 1)",
    });
    // At the end of the transition
    jest.advanceTimersByTime(500);
    expect(testComponent).toHaveAnimatedStyle({
        color: "rgba(0, 0, 255, 1)",
    });
    // Width should not change after the transition is done
    jest.advanceTimersByTime(500);
    expect(testComponent).toHaveAnimatedStyle({
        color: "rgba(0, 0, 255, 1)",
    });
});
//# sourceMappingURL=transitions.test.js.map
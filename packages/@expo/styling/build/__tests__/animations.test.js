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
jest.useFakeTimers();
beforeEach(() => {
    stylesheet_1.StyleSheet.__reset();
});
test("basic animation", () => {
    (0, utils_1.registerCSS)(`
.my-class {
  animation-duration: 3s;
  animation-name: slidein;
}

@keyframes slidein {
  from {
    margin-left: 100%;
  }

  to {
    margin-left: 0%;
  }
}
`);
    const testComponent = (0, react_native_1.render)(react_1.default.createElement(A, { testID: "test", className: "my-class" })).getByTestId("test");
    expect(testComponent).toHaveAnimatedStyle({
        marginLeft: "100%",
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        marginLeft: "50%",
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        marginLeft: "0%",
    });
});
test("single frame", () => {
    (0, utils_1.registerCSS)(`
    .my-class {
      animation-duration: 3s;
      animation-name: spin;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
`);
    const testComponent = (0, react_native_1.render)(react_1.default.createElement(A, { testID: "test", className: "my-class" })).getByTestId("test");
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: "0deg" }],
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: "180deg" }],
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: "360deg" }],
    });
});
test("transform - starting", () => {
    (0, utils_1.registerCSS)(`
    .my-class {
      animation-duration: 3s;
      animation-name: spin;
      transform: rotate(180deg);
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
`);
    const testComponent = (0, react_native_1.render)(react_1.default.createElement(A, { testID: "test", className: "my-class" })).getByTestId("test");
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: "180deg" }],
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: "270deg" }],
    });
    jest.advanceTimersByTime(1500);
    expect(testComponent).toHaveAnimatedStyle({
        transform: [{ rotate: "360deg" }],
    });
});
test("bounce", () => {
    (0, utils_1.registerCSS)(`
    .animate-bounce {
      animation: bounce 1s infinite;
      height: 100px;
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8,0,1,1);
      }

      50% {
        transform: none;
        animation-timing-function: cubic-bezier(0,0,0.2,1);
      }
    }
`);
    const testComponent = (0, react_native_1.render)(react_1.default.createElement(A, { testID: "test", className: "animate-bounce" })).getByTestId("test");
    expect(testComponent).toHaveAnimatedStyle({
        height: 100,
        transform: [
            { translateY: -25 },
            { perspective: 1 },
            { translateX: 0 },
            { scaleX: 1 },
            { scaleY: 1 },
            { rotate: "0deg" },
            { rotateX: "0deg" },
            { rotateY: "0deg" },
            { rotateZ: "0deg" },
            { skewX: "0deg" },
            { skewY: "0deg" },
            { scale: 1 },
        ],
    });
    jest.advanceTimersByTime(500);
    expect(testComponent).toHaveAnimatedStyle({
        height: 100,
        transform: [
            { translateY: 0 },
            { perspective: 1 },
            { translateX: 0 },
            { scaleX: 1 },
            { scaleY: 1 },
            { rotate: "0deg" },
            { rotateX: "0deg" },
            { rotateY: "0deg" },
            { rotateZ: "0deg" },
            { skewX: "0deg" },
            { skewY: "0deg" },
            { scale: 1 },
        ],
    });
    jest.advanceTimersByTime(500);
    expect(testComponent).toHaveAnimatedStyle({
        height: 100,
        transform: [
            { translateY: -25 },
            { perspective: 1 },
            { translateX: 0 },
            { scaleX: 1 },
            { scaleY: 1 },
            { rotate: "0deg" },
            { rotateX: "0deg" },
            { rotateY: "0deg" },
            { rotateZ: "0deg" },
            { skewX: "0deg" },
            { skewY: "0deg" },
            { scale: 1 },
        ],
    });
});
//# sourceMappingURL=animations.test.js.map
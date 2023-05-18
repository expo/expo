"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainerContext = exports.VariableContext = exports.isReduceMotionEnabled = exports.colorScheme = exports.vh = exports.vw = exports.rem = exports.animationMap = exports.styleMetaMap = exports.globalStyles = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const signals_1 = require("./signals");
exports.globalStyles = new Map();
exports.styleMetaMap = new WeakMap();
exports.animationMap = new Map();
exports.rem = createRem(14);
exports.vw = viewportUnit("width", react_native_1.Dimensions);
exports.vh = viewportUnit("height", react_native_1.Dimensions);
exports.colorScheme = createColorScheme(react_native_1.Appearance);
exports.isReduceMotionEnabled = createIsReduceMotionEnabled();
exports.VariableContext = (0, react_1.createContext)({
    "--tw-border-spacing-x": 0,
    "--tw-border-spacing-y": 0,
    "--tw-translate-x": 0,
    "--tw-translate-y": 0,
    "--tw-rotate": 0,
    "--tw-skew-x": "0deg",
    "--tw-skew-y": "0deg",
    "--tw-scale-x": 1,
    "--tw-scale-y": 1,
});
exports.ContainerContext = (0, react_1.createContext)({});
function viewportUnit(key, dimensions) {
    const signal = (0, signals_1.createSignal)(dimensions.get("window")[key] || 0);
    let subscription = dimensions.addEventListener("change", ({ window }) => {
        signal.set(window[key]);
    });
    const get = () => signal.get() || 0;
    const reset = (dimensions) => {
        signal.set(dimensions.get("window")[key] || 0);
        subscription.remove();
        subscription = dimensions.addEventListener("change", ({ window }) => {
            signal.set(window[key]);
        });
    };
    return { get, reset, __set: signal.set };
}
function createRem(defaultValue) {
    const signal = (0, signals_1.createSignal)(defaultValue);
    const get = () => {
        if (react_native_1.Platform.OS === "web" && typeof window !== "undefined") {
            const value = Number.parseFloat(window.document.documentElement.style.getPropertyValue("font-size"));
            if (Number.isNaN(value)) {
                return 16;
            }
        }
        return signal.get() || 14;
    };
    const set = (nextValue) => {
        if (react_native_1.Platform.OS === "web" && typeof window !== "undefined") {
            if (Number.isNaN(nextValue)) {
                return;
            }
            window.document.documentElement.style.setProperty("font-size", `${nextValue}px`);
        }
        else {
            signal.set(nextValue);
        }
    };
    const reset = () => {
        set(defaultValue);
    };
    return { get, set, reset };
}
function createColorScheme(appearance) {
    var _a;
    let isSystem = true;
    const signal = (0, signals_1.createSignal)((_a = appearance.getColorScheme()) !== null && _a !== void 0 ? _a : "light");
    const set = (colorScheme) => {
        var _a;
        if (colorScheme === "system") {
            isSystem = true;
            signal.set((_a = appearance.getColorScheme()) !== null && _a !== void 0 ? _a : "light");
        }
        else {
            isSystem = false;
            signal.set(colorScheme);
        }
    };
    let listener = appearance.addChangeListener(({ colorScheme }) => {
        if (isSystem) {
            signal.set(colorScheme !== null && colorScheme !== void 0 ? colorScheme : "light");
        }
    });
    const reset = (appearance) => {
        var _a;
        listener.remove();
        listener = appearance.addChangeListener(({ colorScheme }) => {
            if (isSystem) {
                signal.set(colorScheme !== null && colorScheme !== void 0 ? colorScheme : "light");
            }
        });
        isSystem = true;
        signal.set((_a = appearance.getColorScheme()) !== null && _a !== void 0 ? _a : "light");
    };
    return { get: signal.get, set, reset };
}
function createIsReduceMotionEnabled() {
    var _a;
    const signal = (0, signals_1.createSignal)(false);
    (_a = react_native_1.AccessibilityInfo.isReduceMotionEnabled()) === null || _a === void 0 ? void 0 : _a.then(signal.set);
    react_native_1.AccessibilityInfo.addEventListener("reduceMotionChanged", signal.set);
    return { ...signal, reset: () => signal.set(false) };
}
//# sourceMappingURL=globals.js.map
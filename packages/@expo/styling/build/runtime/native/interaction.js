"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useInteractionHandlers = exports.useInteractionSignals = void 0;
const react_1 = __importDefault(require("react"));
const signals_1 = require("./signals");
function useInteractionSignals() {
    return react_1.default.useMemo(() => ({
        active: (0, signals_1.createSignal)(false),
        hover: (0, signals_1.createSignal)(false),
        focus: (0, signals_1.createSignal)(false),
        layout: {
            width: (0, signals_1.createSignal)(0),
            height: (0, signals_1.createSignal)(0),
        },
    }), []);
}
exports.useInteractionSignals = useInteractionSignals;
function useInteractionHandlers(props, signals, meta) {
    const propsRef = react_1.default.useRef(props);
    propsRef.current = props;
    /**
     * Does setting a handler for each interaction cause any performance issues?
     * Would it be better to check the conditions on each style and selectively add them?
     *
     * onLayout is only used when there is a containerName, we can easily make that optional
     */
    const memoHandlers = react_1.default.useMemo(() => ({
        // You need onPress for onPressIn and onPressOut to work?
        onPress(event) {
            var _a, _b;
            (_b = (_a = propsRef.current).onPress) === null || _b === void 0 ? void 0 : _b.call(_a, event);
        },
        onPressIn(event) {
            var _a, _b;
            (_b = (_a = propsRef.current).onPressIn) === null || _b === void 0 ? void 0 : _b.call(_a, event);
            signals.active.set(true);
        },
        onPressOut(event) {
            var _a, _b;
            (_b = (_a = propsRef.current).onPressOut) === null || _b === void 0 ? void 0 : _b.call(_a, event);
            signals.active.set(false);
        },
        onHoverIn(event) {
            var _a, _b;
            (_b = (_a = propsRef.current).onHoverIn) === null || _b === void 0 ? void 0 : _b.call(_a, event);
            signals.hover.set(true);
        },
        onHoverOut(event) {
            var _a, _b;
            (_b = (_a = propsRef.current).onHoverIn) === null || _b === void 0 ? void 0 : _b.call(_a, event);
            signals.hover.set(false);
        },
        onFocus(event) {
            var _a, _b;
            (_b = (_a = propsRef.current).onFocus) === null || _b === void 0 ? void 0 : _b.call(_a, event);
            signals.focus.set(true);
        },
        onBlur(event) {
            var _a, _b;
            (_b = (_a = propsRef.current).onBlur) === null || _b === void 0 ? void 0 : _b.call(_a, event);
            signals.focus.set(false);
        },
        onLayout(event) {
            var _a, _b;
            (_b = (_a = propsRef.current).onLayout) === null || _b === void 0 ? void 0 : _b.call(_a, event);
            signals.layout.width.set(event.nativeEvent.layout.width);
            signals.layout.height.set(event.nativeEvent.layout.height);
        },
    }), []);
    const handlers = {};
    if (meta.requiresLayout)
        handlers.onLayout = memoHandlers.onLayout;
    if (meta.hasActive) {
        handlers.onPress = memoHandlers.onPress;
        handlers.onPressIn = memoHandlers.onPressIn;
        handlers.onPressOut = memoHandlers.onPressOut;
    }
    if (meta.hasHover) {
        handlers.onHoverIn = memoHandlers.onHoverIn;
        handlers.onHoverOut = memoHandlers.onHoverOut;
    }
    if (meta.hasFocus) {
        handlers.onFocus = memoHandlers.onFocus;
        handlers.onBlur = memoHandlers.onBlur;
    }
    return handlers;
}
exports.useInteractionHandlers = useInteractionHandlers;
//# sourceMappingURL=interaction.js.map
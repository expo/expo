"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAnimatedComponent = void 0;
const react_native_1 = require("react-native");
const react_native_reanimated_1 = __importDefault(require("react-native-reanimated"));
const animatedCache = new WeakMap([
    [react_native_1.View, react_native_reanimated_1.default.View],
    [react_native_reanimated_1.default.View, react_native_reanimated_1.default.View],
    [react_native_1.Text, react_native_reanimated_1.default.Text],
    [react_native_reanimated_1.default.Text, react_native_reanimated_1.default.Text],
    [react_native_1.Text, react_native_reanimated_1.default.Text],
    [react_native_1.Pressable, react_native_reanimated_1.default.createAnimatedComponent(react_native_1.Pressable)],
]);
function createAnimatedComponent(Component) {
    var _a;
    if (animatedCache.has(Component)) {
        return animatedCache.get(Component);
    }
    else if ((_a = Component.displayName) === null || _a === void 0 ? void 0 : _a.startsWith("AnimatedComponent")) {
        return Component;
    }
    if (!(typeof Component !== "function" ||
        (Component.prototype && Component.prototype.isReactComponent))) {
        throw new Error(`Looks like you're passing an animation style to a function component \`${Component.name}\`. Please wrap your function component with \`React.forwardRef()\` or use a class component instead.`);
    }
    const AnimatedComponent = react_native_reanimated_1.default.createAnimatedComponent(Component);
    animatedCache.set(Component, AnimatedComponent);
    return AnimatedComponent;
}
exports.createAnimatedComponent = createAnimatedComponent;
//# sourceMappingURL=animated-component.js.map
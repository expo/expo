"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeStack = void 0;
const NativeStackNavigator_1 = require("./NativeStackNavigator");
const Protected_1 = require("../views/Protected");
const Screen_1 = require("../views/Screen");
/**
 * Native stack navigator that renders `ScreenStack` and `ScreenStackItem` from `react-native-screens` directly.
 *
 * Uses `useNavigationBuilder` with `StackRouter` for state management while giving full control
 * over the rendering layer.
 *
 * @example
 * ```tsx app/_layout.tsx
 * import { NativeStack } from 'expo-router/unstable-native-stack-view';
 *
 * export default function Layout() {
 *   return <NativeStack />;
 * }
 * ```
 */
exports.NativeStack = Object.assign((props) => {
    return <NativeStackNavigator_1.NativeStackWithContext {...props}/>;
}, {
    Screen: Screen_1.Screen,
    Protected: Protected_1.Protected,
});
//# sourceMappingURL=NativeStack.js.map
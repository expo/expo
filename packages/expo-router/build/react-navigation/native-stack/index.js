"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useAnimatedHeaderHeight = exports.NativeStackView = exports.createNativeStackNavigator = void 0;
/**
 * Navigators
 */
/**
 * @deprecated Reserved for libraries that ship a self-contained navigator, which the `Stack` layout
 * cannot express. There is no stable replacement yet, so expect this factory to change or be removed
 * in a future release. App code should use `Stack` from `expo-router`.
 */
var createNativeStackNavigator_1 = require("./navigators/createNativeStackNavigator");
Object.defineProperty(exports, "createNativeStackNavigator", { enumerable: true, get: function () { return createNativeStackNavigator_1.createNativeStackNavigator; } });
/**
 * Views
 */
var NativeStackView_1 = require("./views/NativeStackView");
Object.defineProperty(exports, "NativeStackView", { enumerable: true, get: function () { return NativeStackView_1.NativeStackView; } });
/**
 * Hooks
 */
var useAnimatedHeaderHeight_1 = require("./utils/useAnimatedHeaderHeight");
Object.defineProperty(exports, "useAnimatedHeaderHeight", { enumerable: true, get: function () { return useAnimatedHeaderHeight_1.useAnimatedHeaderHeight; } });
//# sourceMappingURL=index.js.map
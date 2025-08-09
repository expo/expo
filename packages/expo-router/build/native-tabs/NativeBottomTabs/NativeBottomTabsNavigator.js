"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsNavigatorWithContext = void 0;
exports.NativeTabsNavigator = NativeTabsNavigator;
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const NativeBottomTabsRouter_1 = require("./NativeBottomTabsRouter");
const NativeTabsView_1 = require("./NativeTabsView");
const __1 = require("../..");
// In Jetpack Compose, the default back behavior is to go back to the initial route.
const defaultBackBehavior = 'initialRoute';
function NativeTabsNavigator({ children, backBehavior = defaultBackBehavior, ...rest }) {
    const builder = (0, native_1.useNavigationBuilder)(NativeBottomTabsRouter_1.NativeBottomTabsRouter, {
        children,
        backBehavior,
    });
    return <NativeTabsView_1.NativeTabsView builder={builder} {...rest}/>;
}
const createNativeTabNavigator = (0, native_1.createNavigatorFactory)(NativeTabsNavigator);
exports.NativeTabsNavigatorWithContext = (0, __1.withLayoutContext)(createNativeTabNavigator().Navigator, (screens) => {
    return screens;
});
//# sourceMappingURL=NativeBottomTabsNavigator.js.map
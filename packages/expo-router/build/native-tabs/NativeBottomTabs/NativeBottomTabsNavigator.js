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
const utils_1 = require("./utils");
const linking_1 = require("../../link/linking");
// In Jetpack Compose, the default back behavior is to go back to the initial route.
const defaultBackBehavior = 'initialRoute';
function NativeTabsNavigator({ children, backBehavior = defaultBackBehavior, ...rest }) {
    const builder = (0, native_1.useNavigationBuilder)(NativeBottomTabsRouter_1.NativeBottomTabsRouter, {
        children,
        backBehavior,
    });
    const { state, descriptors } = builder;
    const { routes } = state;
    let focusedIndex = state.index;
    const isAnyRouteFocused = routes[focusedIndex].key &&
        descriptors[routes[focusedIndex].key] &&
        (0, utils_1.shouldTabBeVisible)(descriptors[routes[focusedIndex].key].options);
    if (!isAnyRouteFocused) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error(`The focused tab in NativeTabsView cannot be displayed. Make sure path is correct and the route is not hidden. Path: "${(0, linking_1.getPathFromState)(state)}"`);
        }
        // Set focusedIndex to the first visible tab
        focusedIndex = routes.findIndex((route) => (0, utils_1.shouldTabBeVisible)(descriptors[route.key].options));
    }
    return <NativeTabsView_1.NativeTabsView builder={builder} {...rest} focusedIndex={focusedIndex}/>;
}
const createNativeTabNavigator = (0, native_1.createNavigatorFactory)(NativeTabsNavigator);
exports.NativeTabsNavigatorWithContext = (0, __1.withLayoutContext)(createNativeTabNavigator().Navigator, undefined, true);
//# sourceMappingURL=NativeBottomTabsNavigator.js.map
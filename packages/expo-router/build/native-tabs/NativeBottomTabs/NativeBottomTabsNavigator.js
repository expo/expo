"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabsNavigatorWithContext = exports.NativeTabsContext = void 0;
exports.NativeTabsNavigator = NativeTabsNavigator;
const native_1 = require("@react-navigation/native");
const react_1 = __importStar(require("react"));
const NativeBottomTabsRouter_1 = require("./NativeBottomTabsRouter");
const NativeTabsView_1 = require("./NativeTabsView");
const __1 = require("../..");
const utils_1 = require("./utils");
const linking_1 = require("../../link/linking");
// In Jetpack Compose, the default back behavior is to go back to the initial route.
const defaultBackBehavior = 'initialRoute';
exports.NativeTabsContext = react_1.default.createContext(false);
function NativeTabsNavigator({ children, backBehavior = defaultBackBehavior, ...rest }) {
    if ((0, react_1.use)(exports.NativeTabsContext)) {
        throw new Error('Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.');
    }
    const builder = (0, native_1.useNavigationBuilder)(NativeBottomTabsRouter_1.NativeBottomTabsRouter, {
        children,
        backBehavior,
        screenOptions: {
            disableTransparentOnScrollEdge: rest.disableTransparentOnScrollEdge,
        },
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
    return (<exports.NativeTabsContext value>
      <NativeTabsView_1.NativeTabsView builder={builder} {...rest} focusedIndex={focusedIndex}/>
    </exports.NativeTabsContext>);
}
const createNativeTabNavigator = (0, native_1.createNavigatorFactory)(NativeTabsNavigator);
exports.NativeTabsNavigatorWithContext = (0, __1.withLayoutContext)(createNativeTabNavigator().Navigator, undefined, true);
//# sourceMappingURL=NativeBottomTabsNavigator.js.map
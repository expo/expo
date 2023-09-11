"use strict";
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultNavigator = exports.QualifiedSlot = exports.Slot = exports.useSlot = exports.useNavigatorContext = exports.Navigator = exports.NavigatorContext = void 0;
const native_1 = require("@react-navigation/native");
const React = __importStar(require("react"));
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const Screen_1 = require("./Screen");
const Route_1 = require("../Route");
const withLayoutContext_1 = require("../layouts/withLayoutContext");
const useScreens_1 = require("../useScreens");
// TODO: This might already exist upstream, maybe something like `useCurrentRender` ?
exports.NavigatorContext = React.createContext(null);
if (process.env.NODE_ENV !== 'production') {
    exports.NavigatorContext.displayName = 'NavigatorContext';
}
/** An unstyled custom navigator. Good for basic web layouts */
function Navigator({ initialRouteName, screenOptions, children, router }) {
    const contextKey = (0, Route_1.useContextKey)();
    // Allows adding Screen components as children to configure routes.
    const { screens, children: otherSlot } = (0, withLayoutContext_1.useFilterScreenChildren)(children, {
        isCustomNavigator: true,
        contextKey,
    });
    const sorted = (0, useScreens_1.useSortedScreens)(screens ?? []);
    if (!sorted.length) {
        console.warn(`Navigator at "${contextKey}" has no children.`);
        return null;
    }
    return (React.createElement(QualifiedNavigator, { initialRouteName: initialRouteName, screenOptions: screenOptions, screens: sorted, contextKey: contextKey, router: router }, otherSlot));
}
exports.Navigator = Navigator;
function QualifiedNavigator({ initialRouteName, screenOptions, children, screens, contextKey, router = native_1.StackRouter, }) {
    const { state, navigation, descriptors, NavigationContent } = (0, native_1.useNavigationBuilder)(router, {
        // Used for getting the parent with navigation.getParent('/normalized/path')
        id: contextKey,
        children: screens,
        screenOptions,
        initialRouteName,
    });
    return (React.createElement(exports.NavigatorContext.Provider, { value: {
            contextKey,
            state,
            navigation,
            descriptors,
            router,
        } },
        React.createElement(NavigationContent, null, children)));
}
function useNavigatorContext() {
    const context = React.useContext(exports.NavigatorContext);
    if (!context) {
        throw new Error('useNavigatorContext must be used within a <Navigator />');
    }
    return context;
}
exports.useNavigatorContext = useNavigatorContext;
function useSlot() {
    const context = useNavigatorContext();
    const { state, descriptors } = context;
    const current = state.routes.find((route, i) => {
        return state.index === i;
    });
    if (!current) {
        return null;
    }
    return descriptors[current.key]?.render() ?? null;
}
exports.useSlot = useSlot;
/** Renders the currently selected content. */
function Slot(props) {
    const contextKey = (0, Route_1.useContextKey)();
    const context = React.useContext(exports.NavigatorContext);
    // Ensure the context is for the current contextKey
    if (context?.contextKey !== contextKey) {
        // Qualify the content and re-export.
        return (React.createElement(Navigator, { ...props },
            React.createElement(QualifiedSlot, null)));
    }
    return React.createElement(QualifiedSlot, null);
}
exports.Slot = Slot;
function QualifiedSlot() {
    return useSlot();
}
exports.QualifiedSlot = QualifiedSlot;
function DefaultNavigator() {
    return (React.createElement(react_native_safe_area_context_1.SafeAreaView, { style: { flex: 1 } },
        React.createElement(Navigator, null,
            React.createElement(QualifiedSlot, null))));
}
exports.DefaultNavigator = DefaultNavigator;
Navigator.Slot = Slot;
Navigator.useContext = useNavigatorContext;
/** Used to configure route settings. */
Navigator.Screen = Screen_1.Screen;
//# sourceMappingURL=Navigator.js.map
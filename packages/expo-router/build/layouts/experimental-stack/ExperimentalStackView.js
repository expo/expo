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
exports.ExperimentalStackView = ExperimentalStackView;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const experimental_1 = require("react-native-screens/experimental");
const native_1 = require("../../react-navigation/native");
const useDismissedRouteError_1 = require("../../react-navigation/native-stack/utils/useDismissedRouteError");
const SUPPORTED_OPTION_KEYS = new Set([
    'title',
    'headerShown',
    'headerTransparent',
    'headerBackVisible',
]);
function ExperimentalStackView({ state, navigation, descriptors, describe }) {
    const { setNextDismissedKey } = (0, useDismissedRouteError_1.useDismissedRouteError)(state);
    const { preventedRoutes } = (0, native_1.usePreventRemoveContext)();
    const preloadedDescriptors = state.preloadedRoutes.reduce((acc, route) => {
        acc[route.key] = acc[route.key] || describe(route, true);
        return acc;
    }, {});
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.container, children: (0, jsx_runtime_1.jsx)(experimental_1.Stack.Host, { children: state.routes.concat(state.preloadedRoutes).map((route) => {
                const descriptor = (descriptors[route.key] ?? preloadedDescriptors[route.key]);
                const isPreloaded = preloadedDescriptors[route.key] !== undefined && descriptors[route.key] === undefined;
                const options = (descriptor.options ?? {});
                return ((0, jsx_runtime_1.jsx)(ScreenView, { routeKey: route.key, descriptor: descriptor, options: options, isPreloaded: isPreloaded, preventNativeDismiss: preventedRoutes[route.key]?.preventRemove ?? false, onWillAppear: () => {
                        navigation.emit({
                            type: 'transitionStart',
                            data: { closing: false },
                            target: route.key,
                        });
                    }, onWillDisappear: () => {
                        navigation.emit({
                            type: 'transitionStart',
                            data: { closing: true },
                            target: route.key,
                        });
                    }, onDidAppear: () => {
                        navigation.emit({
                            type: 'transitionEnd',
                            data: { closing: false },
                            target: route.key,
                        });
                    }, onDidDisappear: () => {
                        navigation.emit({
                            type: 'transitionEnd',
                            data: { closing: true },
                            target: route.key,
                        });
                    }, onNativeDismiss: () => {
                        // Native dismissal (e.g. swipe-to-dismiss). JS state still has the route —
                        // catch up by dispatching pop and arming useDismissedRouteError so a stuck
                        // beforeRemove listener surfaces an actionable console.error.
                        navigation.dispatch({
                            ...native_1.StackActions.pop(),
                            source: route.key,
                            target: state.key,
                        });
                        setNextDismissedKey(route.key);
                    }, onNativeDismissPrevented: () => {
                        navigation.emit({
                            type: 'gestureCancel',
                            data: undefined,
                            target: route.key,
                        });
                    } }, route.key));
            }) }) }));
}
function ScreenView({ routeKey, descriptor, options, isPreloaded, preventNativeDismiss, ...lifecycle }) {
    useUnsupportedOptionsWarning(options, descriptor.route.name);
    const headerConfigProps = {
        title: options.title,
        hidden: options.headerShown === undefined ? undefined : !options.headerShown,
        transparent: options.headerTransparent,
        backButtonHidden: options.headerBackVisible === undefined ? undefined : !options.headerBackVisible,
    };
    return ((0, jsx_runtime_1.jsxs)(experimental_1.Stack.Screen, { activityMode: isPreloaded ? 'detached' : 'attached', screenKey: routeKey, preventNativeDismiss: preventNativeDismiss, ...lifecycle, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.scene, children: descriptor.render() }), (0, jsx_runtime_1.jsx)(experimental_1.Stack.HeaderConfig, { ...headerConfigProps })] }));
}
// Composition components like <Stack.Screen.Title> and <Stack.Header> emit benign
// extras such as `headerTitleStyle: {}`, `headerLargeTitle: undefined`, or
// `headerStyle: { backgroundColor: undefined }` even when the user supplied no
// value. Treat any plain object whose enumerable values are all themselves no-op
// as no-op too, so the unsupported-option warning fires only on values that would
// actually have an effect under <Stack />.
function isNoOpOptionValue(value) {
    if (value === undefined)
        return true;
    if (value === null || typeof value !== 'object' || Array.isArray(value))
        return false;
    const record = value;
    for (const key in record) {
        if (!isNoOpOptionValue(record[key]))
            return false;
    }
    return true;
}
function useUnsupportedOptionsWarning(options, routeName) {
    const warnedRef = React.useRef(false);
    React.useEffect(() => {
        if (!__DEV__ || warnedRef.current)
            return;
        const optionsRecord = options;
        const unsupported = Object.keys(options).filter((key) => !SUPPORTED_OPTION_KEYS.has(key) &&
            !isNoOpOptionValue(optionsRecord[key]));
        if (unsupported.length === 0)
            return;
        warnedRef.current = true;
        console.warn(`ExperimentalStack: ignoring unsupported screenOption${unsupported.length > 1 ? 's' : ''} ${unsupported
            .map((key) => `'${key}'`)
            .join(', ')} on route '${routeName}'. ` +
            `The new react-native-screens experimental Stack only supports 'title', 'headerShown', 'headerTransparent', and 'headerBackVisible'. ` +
            `Custom headers, presentation, animation, sheets, and status bar options are not yet available — keep using <Stack /> for those screens.`);
    }, [options, routeName]);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
    },
    scene: {
        flex: 1,
        backgroundColor: 'white',
    },
});
//# sourceMappingURL=ExperimentalStackView.js.map
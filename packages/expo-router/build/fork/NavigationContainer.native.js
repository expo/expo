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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Forked from React Navigation in order to use a custom `useLinking` -> `extractPathFromURL` function.
// https://github.com/react-navigation/react-navigation/blob/main/packages/native/src/NavigationContainer.tsx
const core_1 = require("@react-navigation/core");
const native_1 = require("@react-navigation/native");
const useBackButton_1 = __importDefault(require("@react-navigation/native/src/useBackButton"));
const useDocumentTitle_1 = __importDefault(require("@react-navigation/native/src/useDocumentTitle"));
const useThenable_1 = __importDefault(require("@react-navigation/native/src/useThenable"));
const React = __importStar(require("react"));
const useLinking_1 = __importDefault(require("./useLinking"));
global.REACT_NAVIGATION_DEVTOOLS = new WeakMap();
/**
 * Container component which holds the navigation state designed for React Native apps.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.initialState Initial state object for the navigation tree. When deep link handling is enabled, this will override deep links when specified. Make sure that you don't specify an `initialState` when there's a deep link (`Linking.getInitialURL()`).
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.theme Theme object for the navigators.
 * @param props.linking Options for deep linking. Deep link handling is enabled when this prop is provided, unless `linking.enabled` is `false`.
 * @param props.fallback Fallback component to render until we have finished getting initial state when linking is enabled. Defaults to `null`.
 * @param props.documentTitle Options to configure the document title on Web. Updating document title is handled by default unless `documentTitle.enabled` is `false`.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
function NavigationContainerInner({ theme = native_1.DefaultTheme, linking, fallback = null, documentTitle, onReady, ...rest }, ref) {
    const isLinkingEnabled = linking ? linking.enabled !== false : false;
    if (linking?.config) {
        (0, core_1.validatePathConfig)(linking.config);
    }
    const refContainer = React.useRef(null);
    (0, useBackButton_1.default)(refContainer);
    (0, useDocumentTitle_1.default)(refContainer, documentTitle);
    const { getInitialState } = (0, useLinking_1.default)(refContainer, {
        // independent: rest.independent,
        enabled: isLinkingEnabled,
        prefixes: [],
        ...linking,
    });
    // Add additional linking related info to the ref
    // This will be used by the devtools
    React.useEffect(() => {
        if (refContainer.current) {
            REACT_NAVIGATION_DEVTOOLS.set(refContainer.current, {
                get linking() {
                    return {
                        ...linking,
                        enabled: isLinkingEnabled,
                        prefixes: linking?.prefixes ?? [],
                        getStateFromPath: linking?.getStateFromPath ?? core_1.getStateFromPath,
                        getPathFromState: linking?.getPathFromState ?? core_1.getPathFromState,
                        getActionFromState: linking?.getActionFromState ?? core_1.getActionFromState,
                    };
                },
            });
        }
    });
    const [isResolved, initialState] = (0, useThenable_1.default)(getInitialState);
    React.useImperativeHandle(ref, () => refContainer.current);
    const linkingContext = React.useMemo(() => ({ options: linking }), [linking]);
    const isReady = rest.initialState != null || !isLinkingEnabled || isResolved;
    const onReadyRef = React.useRef(onReady);
    React.useEffect(() => {
        onReadyRef.current = onReady;
    });
    React.useEffect(() => {
        if (isReady) {
            onReadyRef.current?.();
        }
    }, [isReady]);
    if (!isReady) {
        // This is temporary until we have Suspense for data-fetching
        // Then the fallback will be handled by a parent `Suspense` component
        return fallback;
    }
    return (<native_1.LinkingContext.Provider value={linkingContext}>
      <native_1.ThemeProvider value={theme}>
        <core_1.BaseNavigationContainer {...rest} initialState={rest.initialState == null ? initialState : rest.initialState} ref={refContainer}/>
      </native_1.ThemeProvider>
    </native_1.LinkingContext.Provider>);
}
const NavigationContainer = React.forwardRef(NavigationContainerInner);
exports.default = NavigationContainer;
//# sourceMappingURL=NavigationContainer.native.js.map
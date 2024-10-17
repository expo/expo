"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationContainer = void 0;
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const use_latest_callback_1 = __importDefault(require("use-latest-callback"));
const useBackButton_1 = require("./useBackButton");
const useDocumentTitle_1 = require("./useDocumentTitle");
const useLinking_1 = require("./useLinking");
const useThenable_1 = require("./useThenable");
globalThis.REACT_NAVIGATION_DEVTOOLS = new WeakMap();
/**
 * Container component which holds the navigation state designed for React Native apps.
 * This should be rendered at the root wrapping the whole app.
 *
 * @param props.initialState Initial state object for the navigation tree. When deep link handling is enabled, this will override deep links when specified. Make sure that you don't specify an `initialState` when there's a deep link (`Linking.getInitialURL()`).
 * @param props.onReady Callback which is called after the navigation tree mounts.
 * @param props.onStateChange Callback which is called with the latest navigation state when it changes.
 * @param props.onUnhandledAction Callback which is called when an action is not handled.
 * @param props.direction Text direction of the components. Defaults to `'ltr'`.
 * @param props.theme Theme object for the UI elements.
 * @param props.linking Options for deep linking. Deep link handling is enabled when this prop is provided, unless `linking.enabled` is `false`.
 * @param props.fallback Fallback component to render until we have finished getting initial state when linking is enabled. Defaults to `null`.
 * @param props.documentTitle Options to configure the document title on Web. Updating document title is handled by default unless `documentTitle.enabled` is `false`.
 * @param props.children Child elements to render the content.
 * @param props.ref Ref object which refers to the navigation object containing helper methods.
 */
function NavigationContainerInner({ direction = react_native_1.I18nManager.getConstants().isRTL ? 'rtl' : 'ltr', theme = native_1.DefaultTheme, linking, fallback = null, documentTitle, onReady, onStateChange, ...rest }, ref) {
    const isLinkingEnabled = linking ? linking.enabled !== false : false;
    if (linking?.config) {
        (0, native_1.validatePathConfig)(linking.config);
    }
    const refContainer = react_1.default.useRef(null);
    (0, useBackButton_1.useBackButton)(refContainer);
    (0, useDocumentTitle_1.useDocumentTitle)(refContainer, documentTitle);
    const [lastUnhandledLink, setLastUnhandledLink] = react_1.default.useState();
    const { getInitialState } = (0, useLinking_1.useLinking)(refContainer, {
        enabled: isLinkingEnabled,
        prefixes: [],
        ...linking,
    }, setLastUnhandledLink);
    const linkingContext = react_1.default.useMemo(() => ({ options: linking }), [linking]);
    const unhandledLinkingContext = react_1.default.useMemo(() => ({ lastUnhandledLink, setLastUnhandledLink }), [lastUnhandledLink, setLastUnhandledLink]);
    const onReadyForLinkingHandling = (0, use_latest_callback_1.default)(() => {
        // If the screen path matches lastUnhandledLink, we do not track it
        const path = refContainer.current?.getCurrentRoute()?.path;
        setLastUnhandledLink((previousLastUnhandledLink) => {
            if (previousLastUnhandledLink === path) {
                return undefined;
            }
            return previousLastUnhandledLink;
        });
        onReady?.();
    });
    const onStateChangeForLinkingHandling = (0, use_latest_callback_1.default)((state) => {
        // If the screen path matches lastUnhandledLink, we do not track it
        const path = refContainer.current?.getCurrentRoute()?.path;
        setLastUnhandledLink((previousLastUnhandledLink) => {
            if (previousLastUnhandledLink === path) {
                return undefined;
            }
            return previousLastUnhandledLink;
        });
        onStateChange?.(state);
    });
    // Add additional linking related info to the ref
    // This will be used by the devtools
    react_1.default.useEffect(() => {
        if (refContainer.current) {
            REACT_NAVIGATION_DEVTOOLS.set(refContainer.current, {
                get linking() {
                    return {
                        ...linking,
                        enabled: isLinkingEnabled,
                        prefixes: linking?.prefixes ?? [],
                        getStateFromPath: linking?.getStateFromPath ?? native_1.getStateFromPath,
                        getPathFromState: linking?.getPathFromState ?? native_1.getPathFromState,
                        getActionFromState: linking?.getActionFromState ?? native_1.getActionFromState,
                    };
                },
            });
        }
    });
    const [isResolved, initialState] = (0, useThenable_1.useThenable)(getInitialState);
    react_1.default.useImperativeHandle(ref, () => refContainer.current);
    const isLinkingReady = rest.initialState != null || !isLinkingEnabled || isResolved;
    if (!isLinkingReady) {
        // This is temporary until we have Suspense for data-fetching
        // Then the fallback will be handled by a parent `Suspense` component
        return <native_1.ThemeProvider value={theme}>{fallback}</native_1.ThemeProvider>;
    }
    return (<native_1.LocaleDirContext.Provider value={direction}>
      <native_1.UNSTABLE_UnhandledLinkingContext.Provider value={unhandledLinkingContext}>
        <native_1.LinkingContext.Provider value={linkingContext}>
          <native_1.BaseNavigationContainer {...rest} theme={theme} onReady={onReadyForLinkingHandling} onStateChange={onStateChangeForLinkingHandling} initialState={rest.initialState == null ? initialState : rest.initialState} ref={refContainer}/>
        </native_1.LinkingContext.Provider>
      </native_1.UNSTABLE_UnhandledLinkingContext.Provider>
    </native_1.LocaleDirContext.Provider>);
}
exports.NavigationContainer = react_1.default.forwardRef(NavigationContainerInner);
//# sourceMappingURL=NavigationContainer.js.map
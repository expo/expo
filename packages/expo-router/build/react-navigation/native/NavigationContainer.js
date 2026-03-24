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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NavigationContainer = void 0;
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const useLatestCallback_1 = __importDefault(require("../../utils/useLatestCallback"));
const core_1 = require("../core");
const LinkingContext_1 = require("./LinkingContext");
const LocaleDirContext_1 = require("./LocaleDirContext");
const UnhandledLinkingContext_1 = require("./UnhandledLinkingContext");
const DefaultTheme_1 = require("./theming/DefaultTheme");
const useBackButton_1 = require("./useBackButton");
const useDocumentTitle_1 = require("./useDocumentTitle");
const useLinking_1 = require("./useLinking");
const useThenable_1 = require("./useThenable");
globalThis.REACT_NAVIGATION_DEVTOOLS = new WeakMap();
function NavigationContainerInner({ direction = react_native_1.I18nManager.getConstants().isRTL ? 'rtl' : 'ltr', theme = DefaultTheme_1.DefaultTheme, linking, fallback = null, documentTitle, onReady, onStateChange, ...rest }, ref) {
    const isLinkingEnabled = linking ? linking.enabled !== false : false;
    if (linking?.config) {
        (0, core_1.validatePathConfig)(linking.config);
    }
    const refContainer = React.useRef(null);
    (0, useBackButton_1.useBackButton)(refContainer);
    (0, useDocumentTitle_1.useDocumentTitle)(refContainer, documentTitle);
    const [lastUnhandledLink, setLastUnhandledLink] = React.useState();
    const { getInitialState } = (0, useLinking_1.useLinking)(refContainer, {
        enabled: isLinkingEnabled,
        prefixes: [],
        ...linking,
    }, setLastUnhandledLink);
    const linkingContext = React.useMemo(() => ({ options: linking }), [linking]);
    const unhandledLinkingContext = React.useMemo(() => ({ lastUnhandledLink, setLastUnhandledLink }), [lastUnhandledLink, setLastUnhandledLink]);
    const onReadyForLinkingHandling = (0, useLatestCallback_1.default)(() => {
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
    const onStateChangeForLinkingHandling = (0, useLatestCallback_1.default)((state) => {
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
    const [isResolved, initialState] = (0, useThenable_1.useThenable)(getInitialState);
    // FIXME
    // @ts-expect-error not sure why this is not working
    React.useImperativeHandle(ref, () => refContainer.current);
    const isLinkingReady = rest.initialState != null || !isLinkingEnabled || isResolved;
    if (!isLinkingReady) {
        return (<LocaleDirContext_1.LocaleDirContext.Provider value={direction}>
        <core_1.ThemeProvider value={theme}>{fallback}</core_1.ThemeProvider>
      </LocaleDirContext_1.LocaleDirContext.Provider>);
    }
    return (<LocaleDirContext_1.LocaleDirContext.Provider value={direction}>
      <UnhandledLinkingContext_1.UnhandledLinkingContext.Provider value={unhandledLinkingContext}>
        <LinkingContext_1.LinkingContext.Provider value={linkingContext}>
          <core_1.BaseNavigationContainer {...rest} theme={theme} onReady={onReadyForLinkingHandling} onStateChange={onStateChangeForLinkingHandling} initialState={rest.initialState == null ? initialState : rest.initialState} ref={refContainer}/>
        </LinkingContext_1.LinkingContext.Provider>
      </UnhandledLinkingContext_1.UnhandledLinkingContext.Provider>
    </LocaleDirContext_1.LocaleDirContext.Provider>);
}
/**
 * Container component that manages the navigation state.
 * This should be rendered at the root wrapping the whole app.
 */
exports.NavigationContainer = React.forwardRef(NavigationContainerInner);
//# sourceMappingURL=NavigationContainer.js.map
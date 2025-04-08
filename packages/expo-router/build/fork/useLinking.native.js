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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLinking = useLinking;
exports.getInitialURLWithTimeout = getInitialURLWithTimeout;
const native_1 = require("@react-navigation/native");
const ExpoLinking = __importStar(require("expo-linking"));
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const extractPathFromURL_1 = require("./extractPathFromURL");
const linkingHandlers = [];
function useLinking(ref, { enabled = true, prefixes, filter, config, getInitialURL = () => getInitialURLWithTimeout(), subscribe = (listener) => {
    const callback = ({ url }) => listener(url);
    const subscription = react_native_1.Linking.addEventListener('url', callback);
    // Storing this in a local variable stops Jest from complaining about import after teardown
    // @ts-expect-error: removeEventListener is not present in newer RN versions
    const removeEventListener = react_native_1.Linking.removeEventListener?.bind(react_native_1.Linking);
    return () => {
        // https://github.com/facebook/react-native/commit/6d1aca806cee86ad76de771ed3a1cc62982ebcd7
        if (subscription?.remove) {
            subscription.remove();
        }
        else {
            removeEventListener?.('url', callback);
        }
    };
}, getStateFromPath = native_1.getStateFromPath, getActionFromState = native_1.getActionFromState, }, onUnhandledLinking) {
    const independent = (0, native_1.useNavigationIndependentTree)();
    React.useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            return undefined;
        }
        if (independent) {
            return undefined;
        }
        if (enabled !== false && linkingHandlers.length) {
            console.error([
                'Looks like you have configured linking in multiple places. This is likely an error since deep links should only be handled in one place to avoid conflicts. Make sure that:',
                "- You don't have multiple NavigationContainers in the app each with 'linking' enabled",
                '- Only a single instance of the root component is rendered',
                react_native_1.Platform.OS === 'android'
                    ? "- You have set 'android:launchMode=singleTask' in the '<activity />' section of the 'AndroidManifest.xml' file to avoid launching multiple instances"
                    : '',
            ]
                .join('\n')
                .trim());
        }
        const handler = Symbol();
        if (enabled !== false) {
            linkingHandlers.push(handler);
        }
        return () => {
            const index = linkingHandlers.indexOf(handler);
            if (index > -1) {
                linkingHandlers.splice(index, 1);
            }
        };
    }, [enabled, independent]);
    // We store these options in ref to avoid re-creating getInitialState and re-subscribing listeners
    // This lets user avoid wrapping the items in `React.useCallback` or `React.useMemo`
    // Not re-creating `getInitialState` is important coz it makes it easier for the user to use in an effect
    const enabledRef = React.useRef(enabled);
    const prefixesRef = React.useRef(prefixes);
    const filterRef = React.useRef(filter);
    const configRef = React.useRef(config);
    const getInitialURLRef = React.useRef(getInitialURL);
    const getStateFromPathRef = React.useRef(getStateFromPath);
    const getActionFromStateRef = React.useRef(getActionFromState);
    React.useEffect(() => {
        enabledRef.current = enabled;
        prefixesRef.current = prefixes;
        filterRef.current = filter;
        configRef.current = config;
        getInitialURLRef.current = getInitialURL;
        getStateFromPathRef.current = getStateFromPath;
        getActionFromStateRef.current = getActionFromState;
    });
    const getStateFromURL = React.useCallback((url) => {
        if (!url || (filterRef.current && !filterRef.current(url))) {
            return undefined;
        }
        const path = (0, extractPathFromURL_1.extractExpoPathFromURL)(prefixesRef.current, url);
        return path !== undefined ? getStateFromPathRef.current(path, configRef.current) : undefined;
    }, []);
    const getInitialState = React.useCallback(() => {
        let state;
        if (enabledRef.current) {
            const url = getInitialURLRef.current();
            if (url != null) {
                if (typeof url !== 'string') {
                    return url.then((url) => {
                        const state = getStateFromURL(url);
                        if (typeof url === 'string') {
                            // If the link were handled, it gets cleared in NavigationContainer
                            onUnhandledLinking((0, extractPathFromURL_1.extractExpoPathFromURL)(prefixes, url));
                        }
                        return state;
                    });
                }
                else {
                    onUnhandledLinking((0, extractPathFromURL_1.extractExpoPathFromURL)(prefixes, url));
                }
            }
            state = getStateFromURL(url);
        }
        const thenable = {
            then(onfulfilled) {
                return Promise.resolve(onfulfilled ? onfulfilled(state) : state);
            },
            catch() {
                return thenable;
            },
        };
        return thenable;
    }, [getStateFromURL, onUnhandledLinking, prefixes]);
    React.useEffect(() => {
        const listener = (url) => {
            if (!enabled) {
                return;
            }
            const navigation = ref.current;
            const state = navigation ? getStateFromURL(url) : undefined;
            if (navigation && state) {
                // If the link were handled, it gets cleared in NavigationContainer
                onUnhandledLinking((0, extractPathFromURL_1.extractExpoPathFromURL)(prefixes, url));
                const rootState = navigation.getRootState();
                if (state.routes.some((r) => !rootState?.routeNames.includes(r.name))) {
                    return;
                }
                const action = getActionFromStateRef.current(state, configRef.current);
                if (action !== undefined) {
                    try {
                        navigation.dispatch(action);
                    }
                    catch (e) {
                        // Ignore any errors from deep linking.
                        // This could happen in case of malformed links, navigation object not being initialized etc.
                        console.warn(`An error occurred when trying to handle the link '${url}': ${typeof e === 'object' && e != null && 'message' in e ? e.message : e}`);
                    }
                }
                else {
                    navigation.resetRoot(state);
                }
            }
        };
        return subscribe(listener);
    }, [enabled, getStateFromURL, onUnhandledLinking, prefixes, ref, subscribe]);
    return {
        getInitialState,
    };
}
function getInitialURLWithTimeout() {
    if (typeof window === 'undefined') {
        return '';
    }
    else if (react_native_1.Platform.OS === 'ios') {
        // Use the new Expo API for iOS. This has better support for App Clips and handoff.
        return ExpoLinking.getLinkingURL();
    }
    return Promise.race([
        // TODO: Phase this out in favor of expo-linking on Android.
        react_native_1.Linking.getInitialURL(),
        new Promise((resolve) => 
        // Timeout in 150ms if `getInitialState` doesn't resolve
        // Workaround for https://github.com/facebook/react-native/issues/25675
        setTimeout(() => resolve(null), 150)),
    ]);
}
//# sourceMappingURL=useLinking.native.js.map
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
// Forked from react-navigation with a custom `extractPathFromURL` that automatically
// allows any prefix and parses Expo Go URLs.
// For simplicity the following are disabled: enabled, prefixes, independent
// https://github.com/react-navigation/react-navigation/blob/main/packages/native/src/useLinking.native.tsx
const core_1 = require("@react-navigation/core");
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const extractPathFromURL_1 = require("./extractPathFromURL");
const linkingHandlers = [];
function useLinking(ref, { 
// enabled = true,
// prefixes,
filter, config, getInitialURL = () => Promise.race([
    react_native_1.Linking.getInitialURL(),
    new Promise((resolve) => 
    // Timeout in 150ms if `getInitialState` doesn't resolve
    // Workaround for https://github.com/facebook/react-native/issues/25675
    setTimeout(resolve, 150)),
]), subscribe = (listener) => {
    const callback = ({ url }) => listener(url);
    const subscription = react_native_1.Linking.addEventListener('url', callback);
    return () => {
        subscription?.remove();
    };
}, getStateFromPath = core_1.getStateFromPath, getActionFromState = core_1.getActionFromState, }) {
    //   const independent = useNavigationIndependentTree();
    React.useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            return undefined;
        }
        // if (independent) {
        //   return undefined;
        // }
        if (
        // enabled !== false &&
        linkingHandlers.length) {
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
        // if (enabled !== false) {
        linkingHandlers.push(handler);
        // }
        return () => {
            const index = linkingHandlers.indexOf(handler);
            if (index > -1) {
                linkingHandlers.splice(index, 1);
            }
        };
    }, [
    // enabled,
    // independent
    ]);
    // We store these options in ref to avoid re-creating getInitialState and re-subscribing listeners
    // This lets user avoid wrapping the items in `React.useCallback` or `React.useMemo`
    // Not re-creating `getInitialState` is important coz it makes it easier for the user to use in an effect
    //   const enabledRef = React.useRef(enabled);
    //   const prefixesRef = React.useRef(prefixes);
    const filterRef = React.useRef(filter);
    const configRef = React.useRef(config);
    const getInitialURLRef = React.useRef(getInitialURL);
    const getStateFromPathRef = React.useRef(getStateFromPath);
    const getActionFromStateRef = React.useRef(getActionFromState);
    React.useEffect(() => {
        // enabledRef.current = enabled;
        // prefixesRef.current = prefixes;
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
        // NOTE(EvanBacon): This is the important part.
        const path = (0, extractPathFromURL_1.extractExpoPathFromURL)(url);
        return path !== undefined ? getStateFromPathRef.current(path, configRef.current) : undefined;
    }, []);
    const getInitialState = React.useCallback(() => {
        // let state: ResultState | undefined;
        // if (enabledRef.current) {
        const url = getInitialURLRef.current();
        if (url != null && typeof url !== 'string') {
            return url.then((url) => {
                const state = getStateFromURL(url);
                return state;
            });
        }
        const state = getStateFromURL(url);
        // }
        const thenable = {
            then(onfulfilled) {
                onfulfilled?.(state);
                return thenable;
            },
            catch() {
                return thenable;
            },
        };
        return thenable;
    }, [getStateFromURL]);
    React.useEffect(() => {
        const listener = (url) => {
            //   if (!enabled) {
            //     return;
            //   }
            const navigation = ref.current;
            const state = navigation ? getStateFromURL(url) : undefined;
            if (navigation && state) {
                // Make sure that the routes in the state exist in the root navigator
                // Otherwise there's an error in the linking configuration
                const rootState = navigation.getRootState();
                if (state.routes.some((r) => !rootState?.routeNames.includes(r.name))) {
                    console.warn("The navigation state parsed from the URL contains routes not present in the root navigator. This usually means that the linking configuration doesn't match the navigation structure. See https://reactnavigation.org/docs/configuring-links for more details on how to specify a linking configuration.");
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
    }, [
        // enabled,
        getStateFromURL,
        ref,
        subscribe,
    ]);
    return {
        getInitialState,
    };
}
exports.default = useLinking;
//# sourceMappingURL=useLinking.native.js.map
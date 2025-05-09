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
exports.ExpoRoot = ExpoRoot;
const native_1 = require("@react-navigation/native");
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_safe_area_context_1 = require("react-native-safe-area-context");
const constants_1 = require("./constants");
const useDomComponentNavigation_1 = require("./domComponents/useDomComponentNavigation");
const NavigationContainer_1 = require("./fork/NavigationContainer");
const router_store_1 = require("./global-state/router-store");
const serverLocationContext_1 = require("./global-state/serverLocationContext");
const storeContext_1 = require("./global-state/storeContext");
const imperative_api_1 = require("./imperative-api");
const primitives_1 = require("./primitives");
const statusbar_1 = require("./utils/statusbar");
const SplashScreen = __importStar(require("./views/Splash"));
const isTestEnv = process.env.NODE_ENV === 'test';
const INITIAL_METRICS = react_native_1.Platform.OS === 'web' || isTestEnv
    ? {
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }
    : undefined;
const documentTitle = {
    enabled: false,
};
/**
 * @hidden
 */
function ExpoRoot({ wrapper: ParentWrapper = react_1.Fragment, ...props }) {
    /*
     * Due to static rendering we need to wrap these top level views in second wrapper
     * View's like <SafeAreaProvider /> generate a <div> so if the parent wrapper
     * is a HTML document, we need to ensure its inside the <body>
     */
    const wrapper = ({ children }) => {
        return (<ParentWrapper>
        <react_native_safe_area_context_1.SafeAreaProvider 
        // SSR support
        initialMetrics={INITIAL_METRICS}>
          {/* Users can override this by adding another StatusBar element anywhere higher in the component tree. */}
          {statusbar_1.canOverrideStatusBarBehavior && <AutoStatusBar />}
          {children}
        </react_native_safe_area_context_1.SafeAreaProvider>
      </ParentWrapper>);
    };
    return <ContextNavigator {...props} wrapper={wrapper}/>;
}
function AutoStatusBar() {
    return <react_native_1.StatusBar barStyle={(0, react_native_1.useColorScheme)() === 'light' ? 'dark-content' : 'light-content'}/>;
}
const initialUrl = react_native_1.Platform.OS === 'web' && typeof window !== 'undefined'
    ? new URL(window.location.href)
    : undefined;
function ContextNavigator({ context, location: initialLocation = initialUrl, wrapper: WrapperComponent = react_1.Fragment, linking = {}, }) {
    // location and linking.getInitialURL are both used to initialize the router state
    //  - location is used on web and during static rendering
    //  - linking.getInitialURL is used on native
    const serverContext = (0, react_1.useMemo)(() => {
        let contextType = {};
        if (initialLocation instanceof URL) {
            contextType = {
                location: {
                    pathname: initialLocation.pathname + initialLocation.hash,
                    search: initialLocation.search,
                },
            };
        }
        else if (typeof initialLocation === 'string') {
            // The initial location is a string, so we need to parse it into a URL.
            const url = new URL(initialLocation, 'http://placeholder.base');
            contextType = {
                location: {
                    pathname: url.pathname,
                    search: url.search,
                },
            };
        }
        return contextType;
    }, []);
    /*
     * The serverUrl is an initial URL used in server rendering environments.
     * e.g Static renders, units tests, etc
     */
    const serverUrl = serverContext.location
        ? `${serverContext.location.pathname}${serverContext.location.search}`
        : undefined;
    const store = (0, router_store_1.useStore)(context, linking, serverUrl);
    (0, useDomComponentNavigation_1.useDomComponentNavigation)();
    if (store.shouldShowTutorial()) {
        SplashScreen.hideAsync();
        if (process.env.NODE_ENV === 'development') {
            const Tutorial = require('./onboard/Tutorial').Tutorial;
            return (<WrapperComponent>
          <Tutorial />
        </WrapperComponent>);
        }
        else {
            // Ensure tutorial styles are stripped in production.
            return null;
        }
    }
    return (<storeContext_1.StoreContext.Provider value={store}>
      <NavigationContainer_1.NavigationContainer ref={store.navigationRef} initialState={store.state} linking={store.linking} onUnhandledAction={onUnhandledAction} documentTitle={documentTitle} onReady={store.onReady}>
        <serverLocationContext_1.ServerContext.Provider value={serverContext}>
          <WrapperComponent>
            <imperative_api_1.ImperativeApiEmitter />
            <Content />
          </WrapperComponent>
        </serverLocationContext_1.ServerContext.Provider>
      </NavigationContainer_1.NavigationContainer>
    </storeContext_1.StoreContext.Provider>);
}
function Content() {
    const { state, descriptors, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.StackRouter, {
        children: <primitives_1.Screen name={constants_1.INTERNAL_SLOT_NAME} component={router_store_1.store.rootComponent}/>,
    });
    return <NavigationContent>{descriptors[state.routes[0].key].render()}</NavigationContent>;
}
let onUnhandledAction;
if (process.env.NODE_ENV !== 'production') {
    onUnhandledAction = (action) => {
        const payload = action.payload;
        let message = `The action '${action.type}'${payload ? ` with payload ${JSON.stringify(action.payload)}` : ''} was not handled by any navigator.`;
        switch (action.type) {
            case 'NAVIGATE':
            case 'PUSH':
            case 'REPLACE':
            case 'JUMP_TO':
                if (payload?.name) {
                    message += `\n\nDo you have a route named '${payload.name}'?`;
                }
                else {
                    message += `\n\nYou need to pass the name of the screen to navigate to. This may be a bug.`;
                }
                break;
            case 'GO_BACK':
            case 'POP':
            case 'POP_TO_TOP':
                message += `\n\nIs there any screen to go back to?`;
                break;
            case 'OPEN_DRAWER':
            case 'CLOSE_DRAWER':
            case 'TOGGLE_DRAWER':
                message += `\n\nIs your screen inside a Drawer navigator?`;
                break;
        }
        message += `\n\nThis is a development-only warning and won't be shown in production.`;
        if (process.env.NODE_ENV === 'test') {
            throw new Error(message);
        }
        console.error(message);
    };
}
else {
    onUnhandledAction = function () { };
}
//# sourceMappingURL=ExpoRoot.js.map
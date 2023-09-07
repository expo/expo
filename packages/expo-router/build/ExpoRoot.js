import Constants from 'expo-constants';
import { StatusBar } from 'expo-status-bar';
import React, { Fragment } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import UpstreamNavigationContainer from './fork/NavigationContainer';
import { useInitializeExpoRouter } from './global-state/router-store';
import { SplashScreen } from './views/Splash';
const isTestEnv = process.env.NODE_ENV === 'test';
const INITIAL_METRICS = Platform.OS === 'web' || isTestEnv
    ? {
        frame: { x: 0, y: 0, width: 0, height: 0 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }
    : undefined;
const hasViewControllerBasedStatusBarAppearance = Platform.OS === 'ios' &&
    !!Constants.expoConfig?.ios?.infoPlist?.UIViewControllerBasedStatusBarAppearance;
export function ExpoRoot({ wrapper: ParentWrapper = Fragment, ...props }) {
    /*
     * Due to static rendering we need to wrap these top level views in second wrapper
     * View's like <SafeAreaProvider /> generate a <div> so if the parent wrapper
     * is a HTML document, we need to ensure its inside the <body>
     */
    const wrapper = ({ children }) => {
        return (React.createElement(ParentWrapper, null,
            React.createElement(SafeAreaProvider
            // SSR support
            , { 
                // SSR support
                initialMetrics: INITIAL_METRICS },
                children,
                !hasViewControllerBasedStatusBarAppearance && React.createElement(StatusBar, { style: "auto" }))));
    };
    return React.createElement(ContextNavigator, { ...props, wrapper: wrapper });
}
const initialUrl = Platform.OS === 'web' && typeof window !== 'undefined'
    ? new URL(window.location.href)
    : undefined;
function ContextNavigator({ context, location: initialLocation = initialUrl, wrapper: WrapperComponent = Fragment, }) {
    const store = useInitializeExpoRouter(context, initialLocation);
    if (store.shouldShowTutorial()) {
        SplashScreen.hideAsync();
        if (process.env.NODE_ENV === 'development') {
            const Tutorial = require('./onboard/Tutorial').Tutorial;
            return (React.createElement(WrapperComponent, null,
                React.createElement(Tutorial, null)));
        }
        else {
            // Ensure tutorial styles are stripped in production.
            return null;
        }
    }
    const Component = store.rootComponent;
    return (React.createElement(UpstreamNavigationContainer, { ref: store.navigationRef, initialState: store.initialState, linking: store.linking, documentTitle: {
            enabled: false,
        } },
        React.createElement(WrapperComponent, null,
            React.createElement(Component, null))));
}
//# sourceMappingURL=ExpoRoot.js.map
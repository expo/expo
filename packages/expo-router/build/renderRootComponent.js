import { registerRootComponent } from 'expo';
import React from 'react';
import { Platform, View } from 'react-native';
import { SplashScreen, _internal_preventAutoHideAsync } from './views/Splash';
function isBaseObject(obj) {
    if (Object.prototype.toString.call(obj) !== '[object Object]') {
        return false;
    }
    const proto = Object.getPrototypeOf(obj);
    if (proto === null) {
        return true;
    }
    return proto === Object.prototype;
}
function isErrorShaped(error) {
    return (error &&
        typeof error === 'object' &&
        typeof error.name === 'string' &&
        typeof error.message === 'string');
}
/**
 * After we throw this error, any number of tools could handle it.
 * This check ensures the error is always in a reason state before surfacing it to the runtime.
 */
function convertError(error) {
    if (isErrorShaped(error)) {
        return error;
    }
    if (process.env.NODE_ENV === 'development') {
        if (error == null) {
            return new Error('A null/undefined error was thrown.');
        }
    }
    if (isBaseObject(error)) {
        return new Error(JSON.stringify(error));
    }
    return new Error(String(error));
}
/**
 * Register and mount the root component using the predefined rendering
 * method. This function ensures the Splash Screen and errors are handled correctly.
 */
export function renderRootComponent(Component) {
    try {
        // This must be delayed so the user has a chance to call it first.
        setTimeout(() => {
            _internal_preventAutoHideAsync();
        });
        if (process.env.NODE_ENV !== 'production') {
            const { withErrorOverlay } = require('@expo/metro-runtime/error-overlay');
            registerRootComponent(withErrorOverlay(Component));
        }
        else {
            registerRootComponent(Component);
        }
    }
    catch (e) {
        // Hide the splash screen if there was an error so the user can see it.
        SplashScreen.hideAsync();
        const error = convertError(e);
        // Prevent the app from throwing confusing:
        //  ERROR  Invariant Violation: "main" has not been registered. This can happen if:
        // * Metro (the local dev server) is run from the wrong folder. Check if Metro is running, stop it and restart it in the current project.
        // * A module failed to load due to an error and `AppRegistry.registerComponent` wasn't called.
        registerRootComponent(() => React.createElement(View, null));
        // Console is pretty useless on native, on web you get interactive stack traces.
        if (Platform.OS === 'web') {
            console.error(error);
            console.error(`A runtime error has occurred while rendering the root component.`);
        }
        // Give React a tick to render before throwing.
        setTimeout(() => {
            throw error;
        });
        // TODO: Render a production-only error screen.
    }
}
//# sourceMappingURL=renderRootComponent.js.map
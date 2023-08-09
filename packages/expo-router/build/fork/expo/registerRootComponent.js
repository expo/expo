// Fork of:
// https://github.com/expo/expo/blob/main/packages/expo/src/launch/registerRootComponent.tsx
// Originally made in Expo SDK 47 to add support for React 18 and Metro web.
import 'expo/build/Expo.fx';
// NOTE(EvanBacon): Add Metro web support to the global runtime.
import '@expo/metro-runtime';
import { withErrorOverlay } from '@expo/metro-runtime/error-overlay';
import * as React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { createRoot, hydrateRoot } from './createRoot';
// Web root tag is preserved for re-use between refreshes.
let rootTag = null;
export default function registerRootComponent(component) {
    let qualifiedComponent = component;
    if (process.env.NODE_ENV !== 'production') {
        const { withDevTools } = require('expo/build/launch/withDevTools');
        // Add error support to the root component.
        qualifiedComponent = withErrorOverlay(withDevTools(component));
    }
    if (Platform.OS !== 'web') {
        AppRegistry.registerComponent('main', () => qualifiedComponent);
    }
    else if (
    // Skip querying the DOM if we're in a Node.js environment.
    typeof document !== 'undefined') {
        let tag = document.getElementById('root');
        if (!tag) {
            tag = document.getElementById('main');
            if (process.env.NODE_ENV !== 'production') {
                // This block will be removed in production
                if (tag) {
                    console.warn('Mounting the root React component to an HTML element with id "main" is deprecated. Use id "root" instead.');
                }
            }
        }
        if (!tag) {
            throw new Error('Required HTML element with id "root" was not found in the document HTML. This is required for mounting the root React component.');
        }
        // Using React 18 directly because `react-native-web` still uses the old API:
        // https://github.com/necolas/react-native-web/blob/e8098fd029102d7801c32c1ede792bce01808c00/packages/react-native-web/src/exports/render/index.js#L10
        if (process.env.EXPO_PUBLIC_USE_STATIC) {
            hydrateRoot(tag, React.createElement(qualifiedComponent));
        }
        else {
            rootTag ??= createRoot(tag);
            rootTag.render(React.createElement(qualifiedComponent));
        }
    }
}
//# sourceMappingURL=registerRootComponent.js.map
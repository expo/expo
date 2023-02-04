import 'expo/build/Expo.fx';
import * as React from 'react';
import { AppRegistry, Platform } from 'react-native';
import { createRoot } from './createRoot';
export default function registerRootComponent(component) {
    let qualifiedComponent = component;
    if (process.env.NODE_ENV !== 'production') {
        const { withDevTools } = require('./withDevTools');
        qualifiedComponent = withDevTools(component);
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
        const rootTag = createRoot(tag);
        rootTag.render(React.createElement(qualifiedComponent));
    }
}
//# sourceMappingURL=registerRootComponent.js.map
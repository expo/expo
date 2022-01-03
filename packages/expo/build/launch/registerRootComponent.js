import 'expo/build/Expo.fx';
import * as React from 'react';
import { AppRegistry, Platform } from 'react-native';
import withExpoRoot from './withExpoRoot';
export default function registerRootComponent(component) {
    AppRegistry.registerComponent('main', ()=>withExpoRoot(component)
    );
    if (Platform.OS === 'web') {
        var ref;
        const rootTag = (ref = document.getElementById('root')) !== null && ref !== void 0 ? ref : document.getElementById('main');
        AppRegistry.runApplication('main', {
            rootTag
        });
    }
};

//# sourceMappingURL=registerRootComponent.js.map
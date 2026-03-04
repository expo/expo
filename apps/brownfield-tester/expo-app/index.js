import { registerRootComponent } from 'expo';
import { App } from 'expo-router/build/qualified-entry';
import { AppRegistry } from 'react-native';

import { CustomComponent } from './src/components';

// "main" component from expo-router
registerRootComponent(App);

// Additional custom component
AppRegistry.registerComponent('custom-component', () => CustomComponent);

import { registerRootComponent } from 'expo';
import { App } from 'expo-router/build/qualified-entry';
import { AppRegistry } from 'react-native';

import { CustomComponent } from './src/components';
import { CounterScene, SummaryScene } from './src/components/NamedScenes';

// "main" component from expo-router
registerRootComponent(App);

// Additional custom component
AppRegistry.registerComponent('custom-component', () => CustomComponent);
AppRegistry.registerComponent('Counter', () => CounterScene);
AppRegistry.registerComponent('Summary', () => SummaryScene);

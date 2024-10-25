import { registerRootComponent } from 'expo';

import App from './App';

// Hide this target from the JS inspector
globalThis.__expo_hide_from_inspector__ = 'expo-home';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in the Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

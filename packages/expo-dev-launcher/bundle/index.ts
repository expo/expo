import { AppRegistry, LogBox } from 'react-native';
import { enableScreens } from 'react-native-screens';

import { App } from './App';

// the bundle produced by RN 77 doesn't have set and clear -Immediate when running on 76
if (!global.setImmediate) {
  global.setImmediate = require('./immediateShim').setImmediate;
}
if (!global.clearImmediate) {
  global.clearImmediate = require('./immediateShim').clearImmediate;
}

// Hide this target from the JS inspector
globalThis.__expo_hide_from_inspector__ = 'expo-dev-launcher';

LogBox.ignoreLogs(['EventEmitter']);

enableScreens(false);

AppRegistry.registerComponent('main', () => App);

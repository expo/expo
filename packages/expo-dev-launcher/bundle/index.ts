import { AppRegistry, LogBox } from 'react-native';
import { enableScreens } from 'react-native-screens';

import { App } from './App';

LogBox.ignoreLogs(['EventEmitter']);

enableScreens(false);

AppRegistry.registerComponent('main', () => App);

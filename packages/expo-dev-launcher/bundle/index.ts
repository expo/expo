import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';

import { App } from './App';
import LauncherApp from './views/LauncherApp';

enableScreens(false);

AppRegistry.registerComponent('main', () => App);

import { AppRegistry } from 'react-native';

import App from './App';
import { name as appName } from './app.json';
import 'expo-asset';

AppRegistry.registerComponent(appName, () => App);

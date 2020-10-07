import { AppRegistry, Platform, NativeModules } from 'react-native';

import App from './bundle/App';

const DevelopmentClient = NativeModules.EXDevelopmentClient;

if (Platform.OS === 'android') {
  AppRegistry.registerComponent(DevelopmentClient.mainComponentName, () => App);
} else {
  AppRegistry.registerComponent('main', () => App);
}

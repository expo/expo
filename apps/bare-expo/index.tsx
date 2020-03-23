import { AppRegistry, Platform } from 'react-native';

import App from './App';

const appName = 'BareExpo';

AppRegistry.registerComponent(appName, () => App);

if (Platform.OS === 'web') {
  const rootTag = document.getElementById('root') || document.getElementById('main');
  AppRegistry.runApplication(appName, { rootTag });
}

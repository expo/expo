import { AppRegistry } from 'react-native';
import { name as appName } from './app.json'; // eslint-disable-line import/first

AppRegistry.registerComponent(appName, () => {
  return require('./App').default;
});

import { AppRegistry } from 'react-native';
import { _setShouldThrowAnErrorOutsideOfExpo } from '~expo/build/environment/validatorState';
_setShouldThrowAnErrorOutsideOfExpo(false);

import { name as appName } from './app.json'; // eslint-disable-line import/first

AppRegistry.registerComponent(appName, () => {
  return require('native-component-list/App').default;
});

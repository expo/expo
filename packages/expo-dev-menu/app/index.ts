import { AppRegistry } from 'react-native';
import { enableScreens } from 'react-native-screens';

import DevMenuApp from './views/DevMenuApp';

enableScreens(false);

AppRegistry.registerComponent('main', () => DevMenuApp);

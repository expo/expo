import { createAppContainer } from 'react-navigation';
import { createBrowserApp } from '@react-navigation/web';
import { Platform } from 'react-native';

import MainTabNavigator from './MainTabNavigator';

const createApp = Platform.select({
  default: createAppContainer,
  web: createBrowserApp,
});
export default createApp(MainTabNavigator);

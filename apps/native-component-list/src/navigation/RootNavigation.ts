import { createBrowserApp } from '@react-navigation/web';
import { Platform } from 'react-native';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';

import RedirectScreen from '../screens/RedirectScreen';
import MainTabNavigator from './MainTabNavigator';

const createApp = Platform.select({
  web: createBrowserApp,
  default: createAppContainer,
});

export default createApp(
  createSwitchNavigator({
    main: {
      screen: MainTabNavigator,
      navigationOptions: { title: 'Native Component List' },
      path: '',
    },
    Redirect: RedirectScreen,
  })
);

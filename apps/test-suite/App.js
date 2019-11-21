import { createBrowserApp } from '@react-navigation/web';
import { Platform } from 'react-native';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';

import AppNavigator from './AppNavigator';

const createApp = Platform.select({
  web: input =>
    createBrowserApp(createSwitchNavigator({ 'test-suite': input }), { history: 'hash' }),
  default: input => createAppContainer(input),
});

export default createApp(AppNavigator);

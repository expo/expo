import { Routes as ExpoApiRoutes } from './ExpoApis';
import ExpoApisStackNavigator from './ExpoApisStackNavigator';
import { Routes as ExpoComponentRoutes } from './ExpoComponents';
import ExpoComponentsStackNavigator from './ExpoComponentsStackNavigator';
import ReactNativeCoreStackNavigator from './ReactNativeCoreStackNavigator';

// @tsapeta: These navigators are being used by `bare-expo` app,
// so make sure they still work there once you change something here.

export default {
  apis: {
    linking: {
      path: '/apis',
      initialRouteName: 'ExpoApis',
      screens: {
        ExpoApis: '',
        ...ExpoApiRoutes,
      },
    },
    navigator: ExpoApisStackNavigator,
  },
  components: {
    linking: {
      path: '/components',
      initialRouteName: 'ExpoComponents',
      screens: {
        ExpoComponents: '',
        ...ExpoComponentRoutes,
      },
    },
    navigator: ExpoComponentsStackNavigator,
  },
  'react-native': {
    linking: {
      path: '/react-native',
      screens: {
        ReactNativeCore: '',
      },
    },
    navigator: ReactNativeCoreStackNavigator,
  },
};

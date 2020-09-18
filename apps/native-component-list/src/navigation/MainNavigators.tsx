import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { DrawerNavigationOptions } from '@react-navigation/drawer';
import { PathConfig } from '@react-navigation/native';
import { StackNavigationOptions } from '@react-navigation/stack';

import { Routes as ExpoApiRoutes } from './ExpoApis';
import ExpoApisStackNavigator from './ExpoApisStackNavigator';
import { Routes as ExpoComponentRoutes } from './ExpoComponents';
import ExpoComponentsStackNavigator from './ExpoComponentsStackNavigator';

// @tsapeta: These navigators are being used by `bare-expo` app,
// so make sure they still work there once you change something here.

const MainNavigators: Record<
  string,
  | undefined
  | {
      linking: PathConfig;
      navigator: ((props: { navigation: BottomTabNavigationProp<any> }) => JSX.Element) & {
        navigationOptions: StackNavigationOptions & DrawerNavigationOptions;
      };
    }
> = {
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
};

export default MainNavigators;

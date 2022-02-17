import { BottomTabNavigationOptions, BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { PathConfig } from '@react-navigation/native';

import ExpoApisStackNavigator, { Screens as APIScreens } from './ExpoApisStackNavigator';
import ExpoComponentsStackNavigator, {
  Screens as ComponentScreens,
} from './ExpoComponentsStackNavigator';

// @tsapeta: These navigators are being used by `bare-expo` app,
// so make sure they still work there once you change something here.

type ScreenConfig = {
  linking: PathConfig<{ ExpoApis: undefined; ExpoComponents: undefined }>;
  navigator: ((props: { navigation: BottomTabNavigationProp<any> }) => JSX.Element) & {
    navigationOptions: BottomTabNavigationOptions;
  };
};

const apis: ScreenConfig = {
  linking: {
    path: '/apis',
    initialRouteName: 'ExpoApis',
    screens: {
      ExpoApis: '',
      ...APIScreens.reduce(
        (prev, curr) => ({
          ...prev,
          [curr.name]: curr.name.toLowerCase(),
        }),
        {}
      ),
    },
  },
  navigator: ExpoApisStackNavigator,
};

const components: ScreenConfig = {
  linking: {
    path: '/components',
    initialRouteName: 'ExpoComponents',
    screens: {
      ExpoComponents: '',
      ...ComponentScreens.reduce(
        (prev, curr) => ({
          ...prev,
          [curr.name]: curr.route || curr.name.toLowerCase(),
        }),
        {}
      ),
    },
  },
  navigator: ExpoComponentsStackNavigator,
};

export default {
  apis,
  components,
};

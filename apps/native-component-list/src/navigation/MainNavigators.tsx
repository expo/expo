import ExpoApisStackNavigator from './ExpoApisStackNavigator';
import ExpoComponentsStackNavigator from './ExpoComponentsStackNavigator';
import ReactNativeCoreStackNavigator from './ReactNativeCoreStackNavigator';

// @tsapeta: These navigators are being used by `bare-expo` app,
// so make sure they still work there once you change something here.

export default {
  apis: ExpoApisStackNavigator,
  components: ExpoComponentsStackNavigator,
  'react-native': ReactNativeCoreStackNavigator,
};

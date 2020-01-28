import ExpoComponents from '../screens/ExpoComponentsScreen';
import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';
import { Screens } from './ExpoComponents';
import SafeAreaNavigationWrapper from './SafeAreaNavigationWrapper';

const ExpoComponentsStackNavigator = createStackNavigator(
  {
    ExpoComponents,
    ...Screens,
  },
  StackConfig
);

export default SafeAreaNavigationWrapper(ExpoComponentsStackNavigator);

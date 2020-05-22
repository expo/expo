import ExpoComponents from '../screens/ExpoComponentsScreen';
import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';
import { Screens } from './ExpoComponents';
import SafeAreaNavigationWrapper from './SafeAreaNavigationWrapper';
import LoadAssetsNavigationWrapper from './LoadAssetsNavigationWrapper';

const ExpoComponentsStackNavigator = createStackNavigator(
  {
    ExpoComponents,
    ...Screens,
  },
  StackConfig
);

export default LoadAssetsNavigationWrapper(SafeAreaNavigationWrapper(ExpoComponentsStackNavigator));

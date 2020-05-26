import ExpoComponents from '../screens/ExpoComponentsScreen';
import { Screens } from './ExpoComponents';
import LoadAssetsNavigationWrapper from './LoadAssetsNavigationWrapper';
import StackConfig from './StackConfig';
import createStackNavigator from './createStackNavigator';

const ExpoComponentsStackNavigator = createStackNavigator(
  {
    ExpoComponents,
    ...Screens,
  },
  StackConfig
);

export default LoadAssetsNavigationWrapper(ExpoComponentsStackNavigator);

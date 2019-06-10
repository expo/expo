import ExpoComponents from '../screens/ExpoComponentsScreen';
import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';
import { Screens } from './ExpoComponents';

const ExpoComponentsStackNavigator = createStackNavigator(
  { ExpoComponents, ...Screens },
  StackConfig
);

export default ExpoComponentsStackNavigator;

import ExpoComponents from '../screens/ExpoComponentsScreen';
import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';
import { Screens } from './ExpoComponents';

const { Camera2,...RestScreens } = Screens;

const ExpoComponentsStackNavigator = createStackNavigator(
  {
    Camera2,
    ExpoComponents,
    ...RestScreens
  },
  StackConfig
);

export default ExpoComponentsStackNavigator;

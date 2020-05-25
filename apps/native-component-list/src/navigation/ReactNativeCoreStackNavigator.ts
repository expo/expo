import ReactNativeCore from '../screens/ReactNativeCore/ReactNativeCoreScreen';
import StackConfig from './StackConfig';
import createStackNavigator from './createStackNavigator';

const ReactNativeCoreStackNavigator = createStackNavigator(
  {
    ReactNativeCore,
  },
  StackConfig
);

export default ReactNativeCoreStackNavigator;

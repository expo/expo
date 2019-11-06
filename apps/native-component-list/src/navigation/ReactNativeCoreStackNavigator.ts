import ReactNativeCore from '../screens/ReactNativeCore/ReactNativeCoreScreen';
import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';

const ReactNativeCoreStackNavigator = createStackNavigator(
  {
    ReactNativeCore,
  },
  StackConfig
);

export default ReactNativeCoreStackNavigator;

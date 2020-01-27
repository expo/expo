import ReactNativeCore from '../screens/ReactNativeCore/ReactNativeCoreScreen';
import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';
import SafeAreaNavigationWrapper from './SafeAreaNavigationWrapper';

const ReactNativeCoreStackNavigator = createStackNavigator(
  {
    ReactNativeCore,
  },
  StackConfig
);

export default SafeAreaNavigationWrapper(ReactNativeCoreStackNavigator);

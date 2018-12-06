import BasicMaskExample from '../screens/BasicMaskScreen';
import GLMaskExample from '../screens/MaskGLScreen';
import ReactNativeCore from '../screens/ReactNativeCoreScreen';
import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';

const ReactNativeCoreStackNavigator = createStackNavigator(
  {
    ReactNativeCore,
    BasicMaskExample,
    GLMaskExample,
  },
  StackConfig
);

export default ReactNativeCoreStackNavigator;

import { createStackNavigator } from 'react-navigation';

import BasicMaskExample from '../screens/BasicMaskScreen';
import GLMaskExample from '../screens/MaskGLScreen';
import ReactNativeCore from '../screens/ReactNativeCoreScreen';
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

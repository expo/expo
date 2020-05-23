import ExpoApis from '../screens/ExpoApisScreen';
import { Screens } from './ExpoApis';
import LoadAssetsNavigationWrapper from './LoadAssetsNavigationWrapper';
import StackConfig from './StackConfig';
import createStackNavigator from './createStackNavigator';

const ExpoApisStackNavigator = createStackNavigator({ ExpoApis, ...Screens }, StackConfig);

export default LoadAssetsNavigationWrapper(ExpoApisStackNavigator);

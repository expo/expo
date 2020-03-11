import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';
import ExpoApis from '../screens/ExpoApisScreen';
import { Screens } from './ExpoApis';
import SafeAreaNavigationWrapper from './SafeAreaNavigationWrapper';
import LoadAssetsNavigationWrapper from './LoadAssetsNavigationWrapper';

const ExpoApisStackNavigator = createStackNavigator({ ExpoApis, ...Screens }, StackConfig);

export default LoadAssetsNavigationWrapper(SafeAreaNavigationWrapper(ExpoApisStackNavigator));

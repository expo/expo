import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';
import ExpoApis from '../screens/ExpoApisScreen';
import { Screens } from './ExpoApis';
import SafeAreaNavigationWrapper from './SafeAreaNavigationWrapper';

const ExpoApisStackNavigator = createStackNavigator({ ExpoApis, ...Screens }, StackConfig);

export default SafeAreaNavigationWrapper(ExpoApisStackNavigator);

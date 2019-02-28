import createStackNavigator from './createStackNavigator';
import StackConfig from './StackConfig';
import ExpoApis from '../screens/ExpoApisScreen';
import { Screens } from './ExpoApis';

const ExpoApisStackNavigator = createStackNavigator({ ExpoApis, ...Screens }, StackConfig);

export default ExpoApisStackNavigator;

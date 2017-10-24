import { Platform, Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');
const isIPhoneX = Platform.OS === 'ios' && width === 375 && height === 812;
export default isIPhoneX;

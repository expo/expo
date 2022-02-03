//import ImageScreen from './ImageTestsScreen';
import Constants, { ExecutionEnvironment } from 'expo-constants';

import ImageScreen from './ImageAllTestsScreen';

if (Constants.executionEnvironment !== ExecutionEnvironment.Bare) {
  throw new Error('expo-image not yet supported in managed apps');
}

export default ImageScreen;

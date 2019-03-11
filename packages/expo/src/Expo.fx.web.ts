import './environment/validate.fx';
import './environment/logging.fx';

// TODO: Bacon: This is a tricky side-effect
// load expo-asset immediately to set a custom `source` transformer in React Native
import 'expo-asset';

import Constants from 'expo-constants';

if (typeof Constants.manifest.env === 'object') {
  Object.assign(process.env, Constants.manifest.env);
}

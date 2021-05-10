import 'expo/build/Expo.fx';
import { activateKeepAwake } from 'expo-keep-awake';
import registerRootComponent from 'expo/build/launch/registerRootComponent';

import App from '{{relativeProjectPath}}/App';

if (__DEV__) {
  activateKeepAwake();
}

registerRootComponent(App);

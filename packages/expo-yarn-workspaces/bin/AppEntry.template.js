import 'expo/build/Expo.fx';
import registerRootComponent from 'expo/build/launch/registerRootComponent';
import { activateKeepAwakeAsync } from 'expo-keep-awake';

import App from '{{relativeProjectPath}}/App';

if (__DEV__) {
  activateKeepAwakeAsync();
}

registerRootComponent(App);

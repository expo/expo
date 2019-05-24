import { registerRootComponent } from 'expo';
import { activateKeepAwake } from 'expo-keep-awake';

import App from '{{relativeProjectPath}}/App';

if (__DEV__) {
  activateKeepAwake();
}

registerRootComponent(App);

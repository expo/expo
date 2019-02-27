import { registerRootComponent } from 'expo';
import { activate } from 'expo-keep-awake';

import App from '{{relativeProjectPath}}/App';

if (__DEV__) {
  activate();
}

registerRootComponent(App);

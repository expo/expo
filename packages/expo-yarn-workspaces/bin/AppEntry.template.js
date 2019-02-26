import { registerRootComponent } from 'expo';

import App from '{{relativeProjectPath}}/App';

if (__DEV__) {
  const { activate } = require('expo-keep-awake');
  activate();
}

registerRootComponent(App);

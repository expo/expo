import registerRootComponent from 'expo/build/launch/registerRootComponent';
import KeepAwake from 'expo/build/KeepAwake';

import App from '{{relativeProjectPath}}/App';

if (__DEV__) {
  KeepAwake.activate();
}

registerRootComponent(App);

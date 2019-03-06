import { KeepAwake, registerRootComponent } from 'expo';

import App from '{{relativeProjectPath}}/App';

if (__DEV__) {
  KeepAwake.activate();
}

registerRootComponent(App);

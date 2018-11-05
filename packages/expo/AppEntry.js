import { KeepAwake, registerRootComponent } from 'expo';
import App from '../../App';

if (__DEV__) {
  KeepAwake.activate();
}

registerRootComponent(App);

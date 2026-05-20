import { requireNativeModule } from 'expo';

import { initRouterIntegration } from './integrations/expo-router/init';
import { isRouterInstalled } from './integrations/expo-router/router';
import type { Config, ExpoObserveModuleType } from './types';

const native = requireNativeModule<ExpoObserveModuleType>('ExpoObserve');

const ExpoObserve: ExpoObserveModuleType = new Proxy(native, {
  get(target, prop, receiver) {
    if (prop === 'configure') {
      return (config: Config) => {
        if (config.integrations?.['expo-router'] && isRouterInstalled) {
          initRouterIntegration();
        }
        return target.configure(config);
      };
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default ExpoObserve;

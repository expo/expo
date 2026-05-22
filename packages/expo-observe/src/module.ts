import { requireNativeModule } from 'expo';

import { initRouterIntegration } from './integrations/expo-router/init';
import { isRouterInstalled } from './integrations/expo-router/router';
import { initReactNavigationIntegration } from './integrations/react-navigation/init';
import { isReactNavigationInstalled } from './integrations/react-navigation/reactNavigation';
import type { Config, ExpoObserveModuleType } from './types';

const native = requireNativeModule<ExpoObserveModuleType>('ExpoObserve');

const ExpoObserve: ExpoObserveModuleType = new Proxy(native, {
  get(target, prop, receiver) {
    if (prop === 'configure') {
      return (config: Config) => {
        const routerEnabled = !!config.integrations?.['expo-router'];
        const reactNavigationEnabled = !!config.integrations?.['react-navigation'];

        if (routerEnabled && !isRouterInstalled) {
          console.warn(
            "[expo-observe] `integrations: { 'expo-router': true }` was set, but `expo-router` is not installed. The integration will not initialize."
          );
        }
        if (reactNavigationEnabled && !isReactNavigationInstalled) {
          console.warn(
            "[expo-observe] `integrations: { 'react-navigation': true }` was set, but `@react-navigation/native` is not installed. The integration will not initialize."
          );
        }

        const shouldInitRouterIntegration = routerEnabled && isRouterInstalled;
        const shouldInitReactNavigationIntegration =
          reactNavigationEnabled && isReactNavigationInstalled;

        if (shouldInitRouterIntegration && shouldInitReactNavigationIntegration) {
          console.warn(
            "[expo-observe] Both 'expo-router' and 'react-navigation' integrations are enabled. " +
              "Only 'expo-router' will initialize; 'react-navigation' will be ignored. "
          );
        }

        if (shouldInitRouterIntegration) {
          initRouterIntegration();
        } else if (shouldInitReactNavigationIntegration) {
          initReactNavigationIntegration();
        }
        return target.configure(config);
      };
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default ExpoObserve;

import { requireNativeModule } from 'expo';
import AppMetrics from 'expo-app-metrics';

import { initRouterIntegration } from './integrations/expo-router/init';
import { isRouterInstalled } from './integrations/expo-router/router';
import { initReactNavigationIntegration } from './integrations/react-navigation/init';
import { isReactNavigationInstalled } from './integrations/react-navigation/reactNavigation';
import type { ObserveConfig, ObserveModule } from './types';

const native = requireNativeModule<ObserveModule>('ExpoObserve');

const Observe: ObserveModule = new Proxy(native, {
  get(target, prop, receiver) {
    if (prop === 'configure') {
      return (config: ObserveConfig) => {
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
    if (typeof prop === 'string' && !(prop in target)) {
      return Reflect.get(AppMetrics, prop);
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default Observe;

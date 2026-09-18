import { requireNativeModule } from 'expo';
import AppMetrics from 'expo-app-metrics';

import { applyConfig } from './applyConfig';
import { registerIntegrationImpl } from './registerIntegration';
import { reportCaughtError } from './reportCaughtError';
import type { ObserveConfig, ObserveIntegrationsConfig, ObserveModule } from './types';

const native = requireNativeModule<ObserveModule>('ExpoObserve');

const Observe: ObserveModule = new Proxy(native, {
  get(target, prop, receiver) {
    if (prop === 'configure') {
      return (config: ObserveConfig) => {
        applyConfig(config);
        return target.configure(config);
      };
    }

    if (prop === 'reportError') {
      return (error: unknown) => reportCaughtError(error);
    }

    if (prop === 'registerIntegration') {
      return <K extends keyof ObserveIntegrationsConfig>(
        name: K,
        callback: (config: ObserveIntegrationsConfig[K]) => void
      ) => registerIntegrationImpl(target, name, callback);
    }

    // On Android, the native module is a JSI host object, so `prop in target` (and `hasOwnProperty`) report
    // `true` for names it doesn't implement — a host object has no `has` hook. `Object.keys(target)`
    // goes through `getPropertyNames`, which lists the module's actual members, so use it to forward
    // anything not really there (e.g. `logEvent`) to the AppMetrics module.
    if (typeof prop === 'string' && !Object.keys(target).includes(prop)) {
      return Reflect.get(AppMetrics, prop);
    }
    return Reflect.get(target, prop, receiver);
  },
});

export default Observe;

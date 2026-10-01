import { requireNativeModule } from 'expo';
import AppMetrics, { setErrorHandlerEnabled } from 'expo-app-metrics';

import { initRouterIntegration } from './integrations/expo-router/init';
import { isRouterInstalled } from './integrations/expo-router/router';
import { initReactNavigationIntegration } from './integrations/react-navigation/init';
import { isReactNavigationInstalled } from './integrations/react-navigation/reactNavigation';
import { reportCaughtError } from './reportCaughtError';
import type { ObserveConfig, ObserveIntegrationsConfig, ObserveModule } from './types';

/**
 * Normalizes the `networkTraces` sugar (`true` / `false` / `{ enabled, filter }`) into the config
 * shape the native producer persists. `configure` is a full replacement, so an absent
 * `networkTraces` resets to the default: disabled, no filter.
 */
function networkTracesConfigFromOption(networkTraces: ObserveConfig['networkTraces']) {
  const option = networkTraces ?? false;
  if (typeof option === 'boolean') {
    return { enabled: option };
  }
  if (__DEV__) {
    // Hosts are compared against the URL's host, so a full URL or a host:port pair matches
    // nothing and silently records zero traces.
    const malformed = option.filter?.hosts?.filter((host) => /[/:]/.test(host));
    if (malformed?.length) {
      console.warn(
        `[expo-observe] \`networkTraces.filter.hosts\` expects bare hostnames, but got ${malformed.join(', ')}. ` +
          'These match no request, so nothing will be recorded for them. Use "api.myapp.com" rather than "https://api.myapp.com/".'
      );
    }
  }
  // The object form records by default: passing a filter means "record these", so `enabled`
  // only has to be spelled out to turn recording off while keeping the filter configured.
  const enabled = option.enabled ?? true;
  return option.filter != null ? { enabled, filter: option.filter } : { enabled };
}

const native = requireNativeModule<ObserveModule>('ExpoObserve');

const Observe: ObserveModule = new Proxy(native, {
  get(target, prop, receiver) {
    if (prop === 'configure') {
      return (config: ObserveConfig) => {
        // The handler is already installed at this point (it installs on import), so this only
        // toggles whether it records anything.
        setErrorHandlerEnabled(config.errorHandlingEnabled ?? true);

        // Recording is gated in expo-app-metrics (the producer side), so the setting travels
        // there rather than into the native `configure` payload. Applies to future captures
        // only; spans persisted earlier in the launch still dispatch.
        AppMetrics.setNetworkTracesConfig(networkTracesConfigFromOption(config.networkTraces));

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
          initRouterIntegration(config.integrations?.['expo-router']);
        } else if (shouldInitReactNavigationIntegration) {
          initReactNavigationIntegration(config.integrations?.['react-navigation']);
        }
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

export function registerIntegrationImpl<K extends keyof ObserveIntegrationsConfig>(
  target: Pick<ObserveModule, 'addListener' | 'getIntegrations'>,
  name: K,
  callback: (config: ObserveIntegrationsConfig[K]) => void
): void {
  const integrations = target.getIntegrations();
  if (integrations) {
    if (integrations[name]) {
      callback(integrations[name]);
    }
    return;
  }

  const subscription = target.addListener('configure', ({ integrations }) => {
    subscription.remove();
    if (integrations?.[name]) {
      callback(integrations[name]);
    }
  });
}

export default Observe;

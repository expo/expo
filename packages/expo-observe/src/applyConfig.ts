import AppMetrics, { setErrorHandlerEnabled } from 'expo-app-metrics';

import { initRouterIntegration } from './integrations/expo-router/init';
import { isRouterInstalled } from './integrations/expo-router/router';
import { initReactNavigationIntegration } from './integrations/react-navigation/init';
import { isReactNavigationInstalled } from './integrations/react-navigation/reactNavigation';
import type { ObserveConfig } from './types';

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

/**
 * Applies the JS-side part of `Observe.configure`, shared by the native proxy and the web module.
 * The error handler and network traces settings live in `expo-app-metrics`, and the navigation
 * integrations are initialized here; the platform module persists the rest of the config.
 */
export function applyConfig(config: ObserveConfig): void {
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
  const shouldInitReactNavigationIntegration = reactNavigationEnabled && isReactNavigationInstalled;

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
}

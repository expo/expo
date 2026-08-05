import type { ObserveNavigationIntegrationConfig } from '../types';

type NavigationIntegrationConfig = boolean | ObserveNavigationIntegrationConfig | undefined;
type NavigationMetricParams = {
  routeParams: Record<string, unknown>;
} & ({ url: string | undefined; urlHidden?: false } | { url?: undefined; urlHidden: true });
type NavigationRouteParams = {
  routeParams: Record<string, unknown>;
  urlHidden?: true;
};

function getFilteredParamKeys(config: NavigationIntegrationConfig): Set<string> | null {
  const filteredParams = config && typeof config === 'object' ? config.filteredParams : undefined;
  if (!Array.isArray(filteredParams)) return null;

  const keys = new Set(filteredParams.filter((key): key is string => typeof key === 'string'));
  return keys.size > 0 ? keys : null;
}

function prepareNavigationRouteParams(
  config: NavigationIntegrationConfig,
  params: object | undefined
): NavigationRouteParams {
  const filteredKeys = getFilteredParamKeys(config);
  let urlHidden = false;
  const routeParams = Object.fromEntries(
    Object.entries(params ?? {})
      .filter(([key]) => {
        const keep = !filteredKeys?.has(key);
        urlHidden ||= !keep;
        return keep;
      })
      .map(([key, value]) => {
        try {
          if (value === undefined) return null;

          const serialized = JSON.stringify(value);
          if (serialized === undefined) return null;

          return [key, JSON.parse(serialized)] as const;
        } catch {
          // Ignore only the individual param value that cannot cross the native boundary.
          return null;
        }
      })
      .filter((entry): entry is readonly [string, unknown] => entry != null)
  );

  return {
    routeParams,
    ...(urlHidden ? { urlHidden: true as const } : {}),
  };
}

export function getNavigationRouteParams(
  config: NavigationIntegrationConfig,
  params: object | undefined
): NavigationRouteParams {
  const navigationParams = prepareNavigationRouteParams(config, params);
  return navigationParams.urlHidden
    ? { routeParams: navigationParams.routeParams, urlHidden: true }
    : { routeParams: navigationParams.routeParams };
}

export function getNavigationMetricParams(
  config: NavigationIntegrationConfig,
  routeParams: object | undefined,
  url: string | undefined
): NavigationMetricParams {
  const navigationParams = getNavigationRouteParams(config, routeParams);

  return navigationParams.urlHidden
    ? { routeParams: navigationParams.routeParams, urlHidden: true }
    : { routeParams: navigationParams.routeParams, url };
}

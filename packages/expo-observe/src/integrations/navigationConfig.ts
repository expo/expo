import type { ObserveNavigationIntegrationConfig } from '../types';

type NavigationIntegrationConfig = boolean | ObserveNavigationIntegrationConfig | undefined;
type NavigationMetricParams<T extends object | undefined> = {
  routeParams: T | Record<string, never>;
} & ({ url: string | undefined; urlHidden?: false } | { url?: undefined; urlHidden: true });
type FilteredNavigationParams<T extends object | undefined> = {
  routeParams: T | Record<string, never>;
  ignoredParam: boolean;
};
type NavigationRouteParams<T extends object | undefined> = {
  routeParams: T | Record<string, never>;
  urlHidden?: true;
};

function getFilteredParamKeys(config: NavigationIntegrationConfig): Set<string> | null {
  const filteredParams = config && typeof config === 'object' ? config.filteredParams : undefined;
  if (!Array.isArray(filteredParams)) return null;

  const keys = new Set(filteredParams.filter((key): key is string => typeof key === 'string'));
  return keys.size > 0 ? keys : null;
}

export function getNavigationRouteParams<T extends object | undefined>(
  config: NavigationIntegrationConfig,
  params: T
): NavigationRouteParams<T> {
  const { routeParams, ignoredParam } = getFilteredNavigationParams(config, params);
  return {
    routeParams,
    ...(ignoredParam ? { urlHidden: true as const } : {}),
  };
}

function getFilteredNavigationParams<T extends object | undefined>(
  config: NavigationIntegrationConfig,
  params: T
): FilteredNavigationParams<T> {
  const filteredKeys = getFilteredParamKeys(config);
  if (!params || !filteredKeys) return { routeParams: params, ignoredParam: false };

  let ignoredParam = false;
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([key]) => {
      const keep = !filteredKeys.has(key);
      ignoredParam ||= !keep;
      return keep;
    })
  );
  return { routeParams: filtered as T | Record<string, never>, ignoredParam };
}

export function getNavigationMetricParams<T extends object | undefined>(
  config: NavigationIntegrationConfig,
  routeParams: T,
  url: string | undefined
): NavigationMetricParams<T> {
  const navigationParams = getNavigationRouteParams(config, routeParams);

  return navigationParams.urlHidden
    ? { routeParams: navigationParams.routeParams, urlHidden: true }
    : { routeParams: navigationParams.routeParams, url };
}

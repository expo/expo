import type { ObserveNavigationIntegrationConfig } from '../types';
type NavigationIntegrationConfig = boolean | ObserveNavigationIntegrationConfig | undefined;
type NavigationMetricParams<T extends object | undefined> = {
    routeParams: T | Record<string, never>;
} & ({
    url: string | undefined;
    urlHidden?: false;
} | {
    url?: undefined;
    urlHidden: true;
});
type NavigationRouteParams<T extends object | undefined> = {
    routeParams: T | Record<string, never>;
    urlHidden?: true;
};
export declare function getNavigationRouteParams<T extends object | undefined>(config: NavigationIntegrationConfig, params: T): NavigationRouteParams<T>;
export declare function getNavigationMetricParams<T extends object | undefined>(config: NavigationIntegrationConfig, routeParams: T, url: string | undefined): NavigationMetricParams<T>;
export {};
//# sourceMappingURL=navigationConfig.d.ts.map
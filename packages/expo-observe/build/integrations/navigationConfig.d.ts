import type { ObserveNavigationIntegrationConfig } from '../types';
type NavigationIntegrationConfig = boolean | ObserveNavigationIntegrationConfig | undefined;
type NavigationMetricParams = {
    routeParams: Record<string, unknown>;
} & ({
    url: string | undefined;
    urlHidden?: false;
} | {
    url?: undefined;
    urlHidden: true;
});
type NavigationRouteParams = {
    routeParams: Record<string, unknown>;
    urlHidden?: true;
};
export declare function getNavigationRouteParams(config: NavigationIntegrationConfig, params: object | undefined): NavigationRouteParams;
export declare function getNavigationMetricParams(config: NavigationIntegrationConfig, routeParams: object | undefined, url: string | undefined): NavigationMetricParams;
export {};
//# sourceMappingURL=navigationConfig.d.ts.map
import type { ObserveIntegrationsConfig } from '../../types';
import { optionalRouter } from './router';
import { type RouterIntegrationStorage } from './storage';
export declare const isInitialized: () => boolean;
export declare const getRouterIntegrationConfig: () => boolean | import("../../types").ObserveNavigationIntegrationConfig | undefined;
export declare function initRouterIntegration(config?: ObserveIntegrationsConfig['expo-router']): void;
type NavigationEvents = NonNullable<typeof optionalRouter>['unstable_navigationEvents'];
export declare function initListeners(storage: RouterIntegrationStorage, navigationEvents: NavigationEvents): () => void;
export {};
//# sourceMappingURL=init.d.ts.map
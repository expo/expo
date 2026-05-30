import type { ReactNavigationIntegrationStorage } from './storage';
import type { GetPathname } from './types';
export interface ReactNavigationIntegrationContextValue {
    storage: ReactNavigationIntegrationStorage;
    getPathname: GetPathname;
}
export declare const ObserveReactNavigationIntegrationContext: import("react").Context<ReactNavigationIntegrationContextValue | null>;
//# sourceMappingURL=context.d.ts.map
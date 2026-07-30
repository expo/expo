import type { ObserveIntegrationsConfig, ObserveModule } from './types';
declare const Observe: ObserveModule;
export declare function registerIntegrationImpl<K extends keyof ObserveIntegrationsConfig>(target: Pick<ObserveModule, 'addListener' | 'getIntegrations'>, name: K, callback: (config: ObserveIntegrationsConfig[K]) => void): void;
export default Observe;
//# sourceMappingURL=module.d.ts.map
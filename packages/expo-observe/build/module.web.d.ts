import { NativeModule } from 'expo';
import type { Config, ExpoObserveModuleType } from './types';
export * from './types';
declare class ExpoObserveModule extends NativeModule implements ExpoObserveModuleType {
    dispatchEvents(): Promise<void>;
    configure(config: Config): void;
}
declare const _default: typeof ExpoObserveModule;
export default _default;
//# sourceMappingURL=module.web.d.ts.map
import { NativeModule, registerWebModule } from 'expo';

import type { Config, ExpoObserveModuleType, ObserveAttributes } from './types';

export * from './types';

class ExpoObserveModule extends NativeModule implements ExpoObserveModuleType {
  async dispatchEvents() {}
  configure(config: Config): void {}
  setGlobalAttributes(attributes?: ObserveAttributes | null): void {}
  setBundleDefaults(defaults: { environment: string; isJsDev: boolean }): void {}
}

export default registerWebModule(ExpoObserveModule, 'ExpoObserve');

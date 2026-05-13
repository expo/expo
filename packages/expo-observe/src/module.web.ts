import { NativeModule, registerWebModule } from 'expo';

import type { Config, ExpoObserveModuleType } from './types';

export * from './types';

class ExpoObserveModule extends NativeModule implements ExpoObserveModuleType {
  async dispatchEvents() {}
  configure(config: Config): void {}
  setBundleDefaults(defaults: { environment: string; isJsDev: boolean }): void {}
}

export default registerWebModule(ExpoObserveModule, 'ExpoObserve');

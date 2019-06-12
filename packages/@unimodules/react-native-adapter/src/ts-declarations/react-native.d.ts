import * as ReactNative from 'react-native';

declare module 'react-native' {
  interface TurboModule {
    getConstants?: () => { [key: string]: any };
  }

  interface ITurboModuleRegistry {
    get(name: string): TurboModule;
    getEnforcing<T extends TurboModule>(name: string): T;
  }

  const TurboModuleRegistry: ITurboModuleRegistry;
}

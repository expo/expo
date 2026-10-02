import * as __expoModulesCore from 'expo-modules-core';

declare module 'expo-modules-core' {
  namespace ExpoGlobal {
    export let router: {
      /**
       * Experimental API to get the current pathname in Expo Router.
       *
       * @experimental
       */
      get currentPathname(): string | undefined;
      /**
       * Experimental API to get the current route params in Expo Router.
       *
       * @experimental
       */
      get currentParams(): Record<string, string> | undefined;
    };
  }
}

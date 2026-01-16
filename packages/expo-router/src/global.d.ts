declare module 'expo-modules-core' {
  namespace ExpoGlobal {
    /**
     * @experimental
     */
    export let router: {
      get navigationEvents(): {
        enable: () => void;
        saveCurrentPathname: () => void;
      };
      get currentPathname(): string | undefined;
      get currentParams(): Record<string, string> | undefined;
    };
  }
}

export {};

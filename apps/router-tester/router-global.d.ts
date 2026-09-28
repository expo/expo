import 'expo-modules-core';

declare module 'expo-modules-core' {
  namespace ExpoGlobal {
    let router: {
      readonly currentPathname: string | undefined;
      readonly currentParams: Record<string, string> | undefined;
    };
  }
}

declare module 'react-native/Libraries/Utilities/PolyfillFunctions' {
  export function polyfillGlobal(): void;
  export function polyfillGlobal(name: string, install: () => unknown): void;
}

declare module 'react-native/Libraries/Utilities/DevLoadingView' {
  const LoadingView: any;
  export default LoadingView;
}

declare module 'react-native/Libraries/Core/ExceptionsManager' {
  declare class SyntheticError extends Error {}
  const ExceptionsManager: {
    parseException(e: any, isFatal: boolean): void;
    handleException(e: any): void;
    SyntheticError: typeof SyntheticError;
  };
  export default ExceptionsManager;
}

declare module 'react-native/Libraries/NativeModules/specs/NativeLogBox' {
  const NativeLogBox: {
    show(): void;
    hide(): void;
  };
  export default NativeLogBox;
}

declare module 'react-native/Libraries/Core/Devtools/getDevServer' {
  interface DevServerInfo {
    bundleLoadedFromServer: boolean;
    fullBundleUrl: string;
    url: string;
  }
  function getDevServer(): DevServerInfo;
  export default getDevServer;
}

declare module 'react-native/Libraries/Core/Devtools/openFileInEditor' {
  function openFileInEditor(file: string, lineNumber: number): void;
  export default getDevServer;
}

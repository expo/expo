export type ProxyNativeModule = {
  [propertyName: string]: any;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

export type TurboNativeModuleProxy = {
  callMethodAsync: <ReturnType>(
    moduleName: string,
    methodName: string,
    args: any[]
  ) => Promise<ReturnType>;
};

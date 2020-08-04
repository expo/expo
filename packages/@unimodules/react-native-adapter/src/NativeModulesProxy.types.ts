export type ProxyNativeModule = {
  [propertyName: string]: any;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

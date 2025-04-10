export type ProxyNativeModule = {
  addListener?: (eventName: string) => void;
  removeListeners?: (count: number) => void;
} & Record<string, any>;

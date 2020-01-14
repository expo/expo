export declare type ProxyNativeModule = {
    [propertyName: string]: any;
    addListener: (eventName: string) => void;
    removeListeners: (count: number) => void;
};
declare const NativeModulesProxy: {
    [moduleName: string]: ProxyNativeModule;
};
export default NativeModulesProxy;

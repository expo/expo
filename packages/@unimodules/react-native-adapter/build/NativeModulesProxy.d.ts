export declare type ProxyNativeModule = {
    [propertyName: string]: any;
    addListener: (eventName: string) => void;
    removeListeners: (count: number) => void;
};
declare const _default: {
    [moduleName: string]: ProxyNativeModule;
};
export default _default;

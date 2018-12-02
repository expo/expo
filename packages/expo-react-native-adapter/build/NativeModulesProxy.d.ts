declare type ProxyNativeModule = {
    [propertyName: string]: any;
};
declare const NativeModulesProxy: {
    [moduleName: string]: ProxyNativeModule;
};
export default NativeModulesProxy;

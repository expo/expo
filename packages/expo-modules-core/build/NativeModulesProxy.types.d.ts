export declare type ProxyNativeModule = {
    [propertyName: string]: any;
    addListener: (eventName: string) => void;
    removeListeners: (count: number) => void;
};
export declare type TurboNativeModuleProxy = {
    callMethodAsync: <ReturnType>(moduleName: string, methodName: string, args: any[]) => Promise<ReturnType>;
};
//# sourceMappingURL=NativeModulesProxy.types.d.ts.map
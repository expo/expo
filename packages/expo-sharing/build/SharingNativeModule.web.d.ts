type ShareOptions = {
    title?: string;
    text?: string;
    url?: string;
};
declare const _default: {
    isAvailableAsync(): Promise<boolean>;
    shareAsync(url: string, options?: ShareOptions): Promise<void>;
    getSharedPayloads(): never;
    getResolvedSharedPayloadsAsync(): Promise<never>;
    clearSharedPayloads(): never;
};
export default _default;
//# sourceMappingURL=SharingNativeModule.web.d.ts.map
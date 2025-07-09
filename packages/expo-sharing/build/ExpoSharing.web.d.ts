type ShareOptions = {
    title?: string;
    text?: string;
    url?: string;
};
declare const _default: {
    isAvailableAsync(): Promise<boolean>;
    shareAsync(url: string, options?: ShareOptions): Promise<void>;
};
export default _default;
//# sourceMappingURL=ExpoSharing.web.d.ts.map
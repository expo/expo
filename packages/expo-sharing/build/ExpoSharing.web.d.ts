declare type ShareOptions = {
    title?: string;
    text?: string;
    url?: string;
};
declare const _default: {
    readonly name: string;
    isAvailableAsync(): Promise<boolean>;
    shareAsync(url: string, options?: ShareOptions): Promise<void>;
};
export default _default;

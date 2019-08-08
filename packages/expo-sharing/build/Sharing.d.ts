declare type ShareOptions = {
    mimeType?: string;
    UTI?: string;
    dialogTitle?: string;
};
export declare function isAvailableAsync(): Promise<boolean>;
export declare function shareAsync(url: string, options?: ShareOptions): Promise<{}>;
export {};

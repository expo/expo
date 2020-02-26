export declare type SharingOptions = {
    mimeType?: string;
    UTI?: string;
    dialogTitle?: string;
};
export declare function isAvailableAsync(): Promise<boolean>;
export declare function shareAsync(url: string, options?: SharingOptions): Promise<object>;

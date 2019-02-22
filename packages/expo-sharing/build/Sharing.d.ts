interface ShareParams {
    mimeType?: string;
    UTI?: string;
}
export declare function shareAsync(url: string, params?: ShareParams): Promise<any>;
export {};

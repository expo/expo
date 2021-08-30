export declare type SharingOptions = {
    /**
     * Sets `mimeType` for `Intent` *(Android only)*
     */
    mimeType?: string;
    /**
     * ([Uniform Type Identifier](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/understanding_utis/understand_utis_conc/understand_utis_conc.html))
     * the type of the target file *(iOS only)*
     */
    UTI?: string;
    /**
     * Sets share dialog title *(Android and Web only)*
     */
    dialogTitle?: string;
};
/**
 * Determine if the sharing API can be used in this app.
 * @return A promise that fulfills with `true` if the sharing API can be used, and `false` otherwise.
 */
export declare function isAvailableAsync(): Promise<boolean>;
/**
 * Opens action sheet to share file to different applications which can handle this type of file.
 * @param url Local file URL to share.
 * @param options A map of share options.
 */
export declare function shareAsync(url: string, options?: SharingOptions): Promise<object>;

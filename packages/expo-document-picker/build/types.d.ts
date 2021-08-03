/**
 *
 */
export declare type DocumentPickerOptions = {
    type?: string | string[];
    /**
     * If `true`, the picked file is copied to [`FileSystem.CacheDirectory`](filesystem.md#filesystemcachedirectory),
     * which allows other Expo APIs to read the file immediately. This may impact performance for
     * large files, so you should consider setting this to `false` if you expect users to pick
     * particularly large files and your app does not need immediate read access.
     * @default `true`
     */
    copyToCacheDirectory?: boolean;
    /**
     * __Web Only.__ Allows multiple files to be selected from the system UI.
     * @default `false`
     */
    multiple?: boolean;
};
export declare type DocumentResult = {
    type: 'cancel';
} | {
    type: 'success';
    /**
     * Document original name.
     */
    name: string;
    /**
     * Document size in bytes.
     */
    size?: number;
    /**
     * An URI to the local document file.
     */
    uri: string;
    /**
     * Document MIME type.
     */
    mimeType?: string;
    lastModified?: number;
    file?: File;
    output?: FileList | null;
};

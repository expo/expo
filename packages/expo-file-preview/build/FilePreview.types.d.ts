export type FilePreviewOpenOptions = {
    /**
     * Optional display title for the preview when the platform supports one.
     */
    title?: string;
    /**
     * MIME type of the file. Android uses this value to find a matching app for the preview intent.
     * If omitted, Android guesses the MIME type from the file name.
     */
    mimeType?: string;
};
export type FilePreviewCanPreviewOptions = {
    /**
     * MIME type of the file. Android uses this value to find a matching app for the preview intent.
     * If omitted, Android guesses the MIME type from the file name.
     */
    mimeType?: string;
};
//# sourceMappingURL=FilePreview.types.d.ts.map
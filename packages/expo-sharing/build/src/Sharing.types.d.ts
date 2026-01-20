export type SharingOptions = {
    /**
     * Sets `mimeType` for `Intent`.
     * @platform android
     */
    mimeType?: string;
    /**
     * [Uniform Type Identifier](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/understanding_utis/understand_utis_conc/understand_utis_conc.html)
     *  - the type of the target file.
     * @platform ios
     */
    UTI?: string;
    /**
     * Sets share dialog title.
     * @platform android
     * @platform web
     */
    dialogTitle?: string;
    /**
     * set the anchor point for iPad
     * @platform ios
     */
    anchor?: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
    };
};
/**
 * Determines the type of content being shared.
 * - `text`: Plain text content.
 * - `url`: A specific URL.
 * - `audio`: An audio file.
 * - `image`: An image file.
 * - `video`: A video file.
 * - `file`: A generic file.
 *
 * @platform android
 * @platform ios
 * @experimental
 */
export type ShareType = 'text' | 'url' | 'audio' | 'image' | 'video' | 'file';
/**
 * Describes the resolved content type.
 *
 * @platform android
 * @platform ios
 * @experimental
 */
export type ContentType = 'text' | 'audio' | 'image' | 'video' | 'file' | 'website';
/**
 * Represents raw data shared with the app.
 *
 * @platform android
 * @platform ios
 * @experimental
 */
export type SharePayload = {
    /**
     * The primary value of the content.
     * - For `text`, this is the message body.
     * - For `url`, this is the URL string.
     * - For `file`, `image`, `video`, or `audio`, this is typically the file URI.
     *
     * @default ""
     */
    value: string;
    /**
     * The type of the shared content.
     * @default 'text'
     */
    shareType: ShareType;
    /**
     * The MIME type of the contents of the`value` field.
     *
     * @default `text/plain`
     */
    mimeType?: string;
};
export type BaseResolvedSharePayload = SharePayload & {
    /**
     * Uri which can be used to access the shared content. When resolving contents of a URL with redirects, contains the redirect target uri.
     * Null when resolving a [SharePayload](#sharepayload) with a `text` [ShareType](#sharetype).
     */
    contentUri: string | null;
    /**
     * Type of the content accessible via the `contentUri`.
     */
    contentType: ContentType | null;
    /**
     * Mime type of the content accessible via the `contentUri`.
     */
    contentMimeType: string | null;
    /**
     * If applicable, value of the `suggestedFilename` HTTP header field, otherwise the last path component of the `contentUri` field.
     */
    originalName: string | null;
    /**
     * Size of the content accessible via the `contentUri`.
     */
    contentSize: number | null;
};
/**
 * Represents a resolved payload, for which the data can be accessed through an uri.
 *
 * @platform android
 * @platform ios
 * @experimental
 */
export type UriBasedResolvedSharePayload = BaseResolvedSharePayload & {
    contentType: 'audio' | 'file' | 'video' | 'image' | 'website';
    contentUri: string;
};
/**
 * Represents a resolved payload, where a text was shared with the app.
 *
 * @platform android
 * @platform ios
 * @experimental
 */
export type TextBasedResolvedSharePayload = BaseResolvedSharePayload & {
    contentType?: 'text';
};
/**
 * Represents a payload shared with the app, with additional information about the shared contents.
 *
 * @platform android
 * @platform ios
 * @experimental
 */
export type ResolvedSharePayload = UriBasedResolvedSharePayload | TextBasedResolvedSharePayload;
/**
 * Object returned by [useIncomingShare](#useincomingshare) hook containing information about data shared with the app.
 *
 * @platform android
 * @platform ios
 * @experimental
 */
export type UseIncomingShareResult = {
    /**
     * Returns unresolved payloads shared with the app. Synchronous and available immediately after creating the hook.
     */
    sharedPayloads: SharePayload[];
    /**
     * Contains an array of resolved payloads shared with the app. Returns an empty array if the shared payloads are being resolved or if the resolving has failed.
     */
    resolvedSharedPayloads: ResolvedSharePayload[];
    /**
     * Clears payloads shared with the app.
     */
    clearSharedPayloads: () => void;
    /**
     * Boolean indicating whether the current shared payloads are being resolved.
     */
    isResolving: boolean;
    /**
     * Contains an error encountered while resolving the shared payload. Null on success.
     */
    error: Error | null;
    /**
     * Forces a refresh of the shared payloads.
     */
    refreshSharePayloads: () => void;
};
//# sourceMappingURL=Sharing.types.d.ts.map
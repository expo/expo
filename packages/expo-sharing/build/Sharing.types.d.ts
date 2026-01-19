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
 */
export type ShareType = 'text' | 'url' | 'audio' | 'image' | 'video' | 'file';
/**
 * Describes the resolved content type.
 * This distinguishes between generic URLs and specific web content,
 * and categorizes files based on their MIME type.
 */
export type ContentType = 'text' | 'audio' | 'image' | 'video' | 'file' | 'website';
/**
 * Represents direct content shared into the app.
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
     * The MIME type of the `value` field.
     *
     * @default `text/plain`
     */
    mimeType?: string;
};
export type BaseResolvedSharePayload = SharePayload & {
    /**
     * Uri, which can be used to access the shared content. When resolving contents of a URL with redirects, will contain the redirect target uri.
     * Null when resolving for `text` `SharePayload` share type.
     */
    contentUri: string | null;
    /**
     * Type of the content accessible via the `uri`.
     */
    contentType: ContentType | null;
    /**
     * Mime type of the content accessible via the `uri`.
     */
    contentMimeType: string | null;
    /**
     * Value of the `suggestedFilename` HTTP header field or the last path component of the `uri` field.
     */
    originalName: string | null;
    /**
     * Size of the content accessible via the `uri`
     */
    contentSize: number | null;
};
/**
 * Information about content for which the data can be fetched through an uri.
 */
export type UriBasedResolvedSharePayload = BaseResolvedSharePayload & {
    contentType: 'audio' | 'file' | 'video' | 'image' | 'website';
    contentUri: string;
};
/**
 * Information about shared text.
 */
export type TextBasedResolvedSharePayload = BaseResolvedSharePayload & {
    contentType?: Exclude<ContentType, 'audio' | 'file' | 'video' | 'image' | 'website'>;
};
export type ResolvedSharePayload = UriBasedResolvedSharePayload | TextBasedResolvedSharePayload;
//# sourceMappingURL=Sharing.types.d.ts.map
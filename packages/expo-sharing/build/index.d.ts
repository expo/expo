/**
 * Describes a configuration for data types that are possible to share in the application on iOS.
 *
 * @privateRemarks Duplicated from plugin/src/sharingPlugin.types.ts temporarily till the docs
 * reference generation code is able to handle types exported from plugins.
 *
 * @platform ios */
export type ActivationRuleOptions = {
    /**
     * Whether the app should accept shared text.
     * @default false
     */
    supportsText?: boolean;
    /**
     * Determines a maximum number of web URLs that can be shared with the app.
     * When `0` the app will not accept web URL shares.
     *
     * @default 0
     */
    supportsWebUrlWithMaxCount?: number;
    /**
     * Determines a maximum number of images that can be shared with the app.
     * When `0` the app will not accept shared images.
     *
     * @default 0
     */
    supportsImageWithMaxCount?: number;
    /**
     * Determines a maximum number of videos that can be shared with the app.
     * When `0` the app will not accept video shares.
     *
     * @default 0
     */
    supportsMovieWithMaxCount?: number;
    /**
     * Determines a maximum number of files that can be shared with the app.
     * When `0` the app will not accept file shares.
     *
     * @default 0
     */
    supportsFileWithMaxCount?: number;
    /**
     * Determines a maximum number of webpages that can be shared with the app.
     * When `0` the app will not accept webpage shares.
     *
     * @default 0
     */
    supportsWebPageWithMaxCount?: number;
    /**
     * Determines a maximum number of attachments that can be shared with the app.
     * When `0` the app will not accept attachment shares.
     *
     * @default 0
     */
    supportsAttachmentsWithMaxCount?: number;
};
export { useIncomingShare } from './useIncomingShare';
export type * from './Sharing.types';
export * from './Sharing';
//# sourceMappingURL=index.d.ts.map
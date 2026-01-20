export type SingleShareAction = 'android.intent.action.SEND';
export type MultiShareAction = 'android.intent.action.SEND_MULTIPLE';
export type ShareAction = SingleShareAction | MultiShareAction;
export type IntentFilter = {
    action: ShareAction;
    category: 'android.intent.category.DEFAULT';
    filters: string[];
    data: {
        mimeType: string;
    }[];
};
export type SingleIntentFilter = IntentFilter & {
    action: SingleShareAction;
};
export type MultiIntentFilter = IntentFilter & {
    action: MultiShareAction;
};
/**
 * Describes a configuration for data types possible to share into the application on iOS.
 */
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
export type ActivationRule = ActivationRuleOptions | string;
export type ShareExtensionConfigPluginProps = {
    ios?: {
        enabled?: boolean;
        extensionBundleIdentifier?: string;
        appGroupId?: string;
        activationRule?: ActivationRule;
    };
    android?: {
        enabled?: boolean;
        singleShareMimeTypes?: string[];
        multipleShareMimeTypes?: string[];
    };
};
//# sourceMappingURL=sharingPlugin.types.d.ts.map
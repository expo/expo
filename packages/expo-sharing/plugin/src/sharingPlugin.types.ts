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

export type ActivationRuleOptions = {
  supportsText?: boolean;
  supportsWebUrlWithMaxCount?: number;
  supportsImageWithMaxCount?: number;
  supportsMovieWithMaxCount?: number;
  supportsFileWithMaxCount?: number;
  supportsWebPageWithMaxCount?: number;
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

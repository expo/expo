export declare type NativeAnalyticsParameters = {
    campaign?: string;
    content?: string;
    medium?: string;
    source?: string;
    term?: string;
};
export declare type NativeAndroidParameters = {
    fallbackUrl?: string;
    minimumVersion?: number;
    packageName?: string;
};
export declare type NativeIOSParameters = {
    appStoreId?: string;
    bundleId?: string;
    customScheme?: string;
    fallbackUrl?: string;
    iPadBundleId?: string;
    iPadFallbackUrl?: string;
    minimumVersion?: string;
};
export declare type NativeITunesParameters = {
    affiliateToken?: string;
    campaignToken?: string;
    providerToken?: string;
};
export declare type NativeNavigationParameters = {
    forcedRedirectEnabled?: boolean;
};
export declare type NativeSocialParameters = {
    descriptionText?: string;
    imageUrl?: string;
    title?: string;
};
export declare type NativeDynamicLink = {
    analytics: NativeAnalyticsParameters;
    android: NativeAndroidParameters;
    dynamicLinkDomain: string;
    ios: NativeIOSParameters;
    itunes: NativeITunesParameters;
    link: string;
    navigation: NativeNavigationParameters;
    social: NativeSocialParameters;
};
export declare type DynamicLink = {
    [key: string]: any;
};

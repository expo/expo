export declare type NativeAndroidInvitation = {
    additionalReferralParameters?: {
        [key: string]: string;
    };
    emailHtmlContent?: string;
    emailSubject?: string;
    googleAnalyticsTrackingId?: string;
};
export declare type NativeInvitation = {
    android?: NativeAndroidInvitation;
    androidClientId?: string;
    androidMinimumVersionCode?: number;
    callToActionText?: string;
    customImage?: string;
    deepLink?: string;
    iosClientId?: string;
    message: string;
    title: string;
};
export declare type Invitation = {
    [key: string]: any;
};

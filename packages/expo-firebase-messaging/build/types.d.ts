export declare type Notification = {
    body: string;
    bodyLocalizationArgs?: string[];
    bodyLocalizationKey?: string;
    clickAction?: string;
    color?: string;
    icon?: string;
    link?: string;
    sound: string;
    subtitle?: string;
    tag?: string;
    title: string;
    titleLocalizationArgs?: string[];
    titleLocalizationKey?: string;
};
export declare type NativeInboundRemoteMessage = {
    collapseKey?: string;
    data: {
        [key: string]: string;
    };
    from?: string;
    messageId: string;
    messageType?: string;
    sentTime?: number;
    to?: string;
    ttl?: number;
};
export declare type NativeOutboundRemoteMessage = {
    collapseKey?: string;
    data: {
        [key: string]: string;
    };
    messageId: string;
    messageType?: string;
    to: string;
    ttl: number;
};

export interface BaseNotificationRequest {
    title?: string;
    subtitle?: string;
    message?: string;
    badge?: number;
    body?: string;
    sound?: boolean;
}
export interface IosNotificationRequestOptions {
    launchImageName?: string;
    attachments?: {
        url: string;
        identifier?: string;
        typeHint?: string;
        hideThumbnail?: boolean;
        thumbnailClipArea?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        thumbnailTime?: number;
    }[];
}
export interface AndroidNotificationRequestOptions {
}
export declare type NotificationRequest = BaseNotificationRequest & (IosNotificationRequestOptions | AndroidNotificationRequestOptions);

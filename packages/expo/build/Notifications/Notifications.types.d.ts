export declare type Sound = boolean | string;
export declare type Notification = {
    origin: 'selected' | 'received';
    data: any;
    remote: boolean;
    isMultiple: boolean;
};
export declare type LocalNotification = {
    title: string;
    body?: string;
    data?: any;
    categoryId?: string;
    ios?: {
        sound?: Sound;
        _displayInForeground?: boolean;
    };
    android?: {
        channelId?: string;
        icon?: string;
        color?: string;
        sticky?: boolean;
        link?: string;
    };
    web?: NotificationOptions;
};
export declare type Channel = {
    name: string;
    description?: string;
    priority?: string;
    sound?: Sound;
    vibrate?: boolean | number[];
    badge?: boolean;
};
export declare type ActionType = {
    actionId: string;
    buttonTitle: string;
    isDestructive?: boolean;
    isAuthenticationRequired?: boolean;
    doNotOpenInForeground?: boolean;
    textInput?: {
        submitButtonTitle: string;
        placeholder: string;
    };
};
export declare type LocalNotificationId = string | number;

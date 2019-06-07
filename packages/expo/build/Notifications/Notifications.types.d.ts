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
        sound?: boolean;
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
    remote?: boolean;
};
export declare type Channel = {
    name: string;
    description?: string;
    priority?: string;
    sound?: boolean;
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
export declare type UserInteraction = LocalNotification & {
    actionType?: string;
    userText?: string;
};
export declare type OnUserInteractionListener = (userInteraction: UserInteraction) => void;
export declare type OnForegroundNotificationListener = (notification: LocalNotification) => void;
export declare type LocalNotificationId = string | number;

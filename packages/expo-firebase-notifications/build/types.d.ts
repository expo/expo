export declare enum BadgeIconType {
    Large = 2,
    None = 0,
    Small = 1
}
export declare enum Category {
    Alarm = "alarm",
    Call = "call",
    Email = "email",
    Error = "err",
    Event = "event",
    Message = "msg",
    Progress = "progress",
    Promo = "promo",
    Recommendation = "recommendation",
    Reminder = "reminder",
    Service = "service",
    Social = "social",
    Status = "status",
    System = "system",
    Transport = "transport"
}
export declare enum Defaults {
    All = -1,
    Lights = 4,
    Sound = 1,
    Vibrate = 2
}
export declare enum GroupAlert {
    All = 0,
    Children = 2,
    Summary = 1
}
export declare enum Importance {
    Default = 3,
    High = 4,
    Low = 2,
    Max = 5,
    Min = 1,
    None = 0,
    Unspecified = -1000
}
export declare enum Priority {
    Default = 0,
    High = 1,
    Low = -1,
    Max = 2,
    Min = -2
}
export declare enum SemanticAction {
    Archive = 5,
    Call = 10,
    Delete = 4,
    MarkAsRead = 2,
    MarkAsUnread = 3,
    Mute = 6,
    None = 0,
    Reply = 1,
    ThumbsDown = 9,
    ThumbsUp = 8,
    Unmute = 7
}
export declare enum Visibility {
    Private = 0,
    Public = 1,
    Secret = -1
}
export declare type Notification = any;
export declare type Notifications = any;
export declare type BigPicture = {
    contentTitle?: string;
    largeIcon?: string;
    picture: string;
    summaryText?: string;
};
export declare type BigText = {
    contentTitle?: string;
    summaryText?: string;
    text: string;
};
export declare type Lights = {
    argb: number;
    onMs: number;
    offMs: number;
};
export declare type Progress = {
    max: number;
    progress: number;
    indeterminate: boolean;
};
export declare type SmallIcon = {
    icon: string;
    level?: number;
};
export declare type AndroidAllowDataType = {
    allow: boolean;
    mimeType: string;
};
export declare type NativeAndroidChannel = {
    bypassDnd?: boolean;
    channelId: string;
    description?: string;
    group?: string;
    importance: Importance;
    lightColor?: string;
    lightsEnabled?: boolean;
    lockScreenVisibility?: Visibility;
    name: string;
    showBadge?: boolean;
    sound?: string;
    vibrationEnabled?: boolean;
    vibrationPattern?: number[];
};
export declare type NativeAndroidRemoteInput = {
    allowedDataTypes: AndroidAllowDataType[];
    allowFreeFormInput?: boolean;
    choices: string[];
    label?: string;
    resultKey: string;
};
export declare type NativeAndroidChannelGroup = {
    groupId: string;
    name: string;
};
export declare type NativeAndroidAction = {
    action: string;
    allowGeneratedReplies?: boolean;
    icon: string;
    remoteInputs: NativeAndroidRemoteInput[];
    semanticAction?: SemanticAction;
    showUserInterface?: boolean;
    title: string;
};
export declare type NativeAndroidNotification = {
    actions?: NativeAndroidAction[];
    autoCancel?: boolean;
    badgeIconType?: BadgeIconType;
    bigPicture?: BigPicture;
    bigText?: BigText;
    category?: Category;
    channelId: string;
    clickAction?: string;
    color?: string;
    colorized?: boolean;
    contentInfo?: string;
    defaults?: Defaults[];
    group?: string;
    groupAlertBehaviour?: GroupAlert;
    groupSummary?: boolean;
    inboxStyle?: InboxStyle;
    largeIcon?: string;
    lights?: Lights;
    localOnly?: boolean;
    number?: number;
    ongoing?: boolean;
    onlyAlertOnce?: boolean;
    people: string[];
    priority?: Priority;
    progress?: Progress;
    remoteInputHistory?: string[];
    shortcutId?: string;
    showWhen?: boolean;
    smallIcon: SmallIcon;
    sortKey?: string;
    tag?: string;
    ticker?: string;
    timeoutAfter?: number;
    usesChronometer?: boolean;
    vibrate?: number[];
    visibility?: Visibility;
    when?: number;
};
export declare type IOSAttachmentOptions = {
    typeHint: string;
    thumbnailHidden: boolean;
    thumbnailClippingRect: {
        height: number;
        width: number;
        x: number;
        y: number;
    };
    thumbnailTime: number;
};
export declare type IOSAttachment = {
    identifier: string;
    options?: IOSAttachmentOptions;
    url: string;
};
export declare type NativeIOSNotification = {
    summaryArgumentCount?: number;
    summaryArgument?: string;
    isCritical: boolean;
    volume?: number;
    alertAction?: string;
    attachments: IOSAttachment[];
    badge?: number;
    category?: string;
    hasAction?: boolean;
    launchImage?: string;
    threadIdentifier?: string;
    location?: any;
};
export declare type InboxStyle = {
    contentTitle?: string;
    summaryText?: string;
    lines: string[];
};
export declare type Schedule = {
    exact?: boolean;
    fireDate: number;
    repeatInterval?: 'minute' | 'hour' | 'day' | 'week';
};
export declare type NativeNotification = {
    android?: NativeAndroidNotification;
    body: string;
    data: {
        [key: string]: string;
    };
    ios?: NativeIOSNotification;
    notificationId: string;
    schedule?: Schedule;
    sound?: string;
    subtitle?: string;
    title: string;
};
export declare type NativeNotificationOpen = {
    action: string;
    notification: NativeNotification;
    results?: {
        [key: string]: string;
    };
};

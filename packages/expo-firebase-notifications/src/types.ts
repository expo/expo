export enum BadgeIconType {
  Large = 2,
  None = 0,
  Small = 1,
}

export enum Category {
  Alarm = 'alarm',
  Call = 'call',
  Email = 'email',
  Error = 'err',
  Event = 'event',
  Message = 'msg',
  Progress = 'progress',
  Promo = 'promo',
  Recommendation = 'recommendation',
  Reminder = 'reminder',
  Service = 'service',
  Social = 'social',
  Status = 'status',
  System = 'system',
  Transport = 'transport',
}

export enum Defaults {
  All = -1,
  Lights = 4,
  Sound = 1,
  Vibrate = 2,
}

export enum GroupAlert {
  All = 0,
  Children = 2,
  Summary = 1,
}

export enum Importance {
  Default = 3,
  High = 4,
  Low = 2,
  Max = 5,
  Min = 1,
  None = 0,
  Unspecified = -1000,
}

export enum Priority {
  Default = 0,
  High = 1,
  Low = -1,
  Max = 2,
  Min = -2,
}

export enum SemanticAction {
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
  Unmute = 7,
}

export enum Visibility {
  Private = 0,
  Public = 1,
  Secret = -1,
}

export type Notification = any;
export type Notifications = any;

export type BigPicture = {
  contentTitle?: string;
  largeIcon?: string;
  picture: string;
  summaryText?: string;
};

export type BigText = {
  contentTitle?: string;
  summaryText?: string;
  text: string;
};

export type Lights = {
  argb: number;
  onMs: number;
  offMs: number;
};

export type Progress = {
  max: number;
  progress: number;
  indeterminate: boolean;
};

export type SmallIcon = {
  icon: string;
  level?: number;
};

export type AndroidAllowDataType = {
  allow: boolean;
  mimeType: string;
};
export type NativeAndroidChannel = {
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

export type NativeAndroidRemoteInput = {
  allowedDataTypes: AndroidAllowDataType[];
  allowFreeFormInput?: boolean;
  choices: string[];
  label?: string;
  resultKey: string;
};
export type NativeAndroidChannelGroup = {
  groupId: string;
  name: string;
};
export type NativeAndroidAction = {
  action: string;
  allowGeneratedReplies?: boolean;
  icon: string;
  remoteInputs: NativeAndroidRemoteInput[];
  semanticAction?: SemanticAction;
  showUserInterface?: boolean;
  title: string;
};

export type NativeAndroidNotification = {
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
  // publicVersion: Notification,
  remoteInputHistory?: string[];
  shortcutId?: string;
  showWhen?: boolean;
  smallIcon: SmallIcon;
  sortKey?: string;
  // TODO: style: Style,
  tag?: string;
  ticker?: string;
  timeoutAfter?: number;
  usesChronometer?: boolean;
  vibrate?: number[];
  visibility?: Visibility;
  when?: number;
};

export type IOSAttachmentOptions = {
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

export type IOSAttachment = {
  identifier: string;
  options?: IOSAttachmentOptions;
  url: string;
};

export type NativeIOSNotification = {
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

export type InboxStyle = {
  contentTitle?: string;
  summaryText?: string;
  lines: string[];
};

export type Schedule = {
  exact?: boolean;
  fireDate: number;
  repeatInterval?: 'minute' | 'hour' | 'day' | 'week';
};

export type NativeNotification = {
  android?: NativeAndroidNotification;
  body: string;
  data: { [key: string]: string };
  ios?: NativeIOSNotification;
  notificationId: string;
  schedule?: Schedule;
  sound?: string;
  subtitle?: string;
  title: string;
};

export type NativeNotificationOpen = {
  action: string;
  notification: NativeNotification;
  results?: { [key: string]: string };
};

/**
 * @flow
 */
export const BadgeIconType = {
  Large: 2,
  None: 0,
  Small: 1,
};

export const Category = {
  Alarm: 'alarm',
  Call: 'call',
  Email: 'email',
  Error: 'err',
  Event: 'event',
  Message: 'msg',
  Progress: 'progress',
  Promo: 'promo',
  Recommendation: 'recommendation',
  Reminder: 'reminder',
  Service: 'service',
  Social: 'social',
  Status: 'status',
  System: 'system',
  Transport: 'transport',
};

export const Defaults = {
  All: -1,
  Lights: 4,
  Sound: 1,
  Vibrate: 2,
};

export const GroupAlert = {
  All: 0,
  Children: 2,
  Summary: 1,
};

export const Importance = {
  Default: 3,
  High: 4,
  Low: 2,
  Max: 5,
  Min: 1,
  None: 0,
  Unspecified: -1000,
};

export const Priority = {
  Default: 0,
  High: 1,
  Low: -1,
  Max: 2,
  Min: -2,
};

export const SemanticAction = {
  Archive: 5,
  Call: 10,
  Delete: 4,
  MarkAsRead: 2,
  MarkAsUnread: 3,
  Mute: 6,
  None: 0,
  Reply: 1,
  ThumbsDown: 9,
  ThumbsUp: 8,
  Unmute: 7,
};

export const Visibility = {
  Private: 0,
  Public: 1,
  Secret: -1,
};

export type BadgeIconTypeType = $Values<typeof BadgeIconType>;
export type CategoryType = $Values<typeof Category>;
export type DefaultsType = $Values<typeof Defaults>;
export type GroupAlertType = $Values<typeof GroupAlert>;
export type ImportanceType = $Values<typeof Importance>;
export type PriorityType = $Values<typeof Priority>;
export type SemanticActionType = $Values<typeof SemanticAction>;
export type VisibilityType = $Values<typeof Visibility>;

export type BigPicture = {|
  contentTitle?: string,
  largeIcon?: string,
  picture: string,
  summaryText?: string,
|};

export type BigText = {|
  contentTitle?: string,
  summaryText?: string,
  text: string,
|};

export type Lights = {|
  argb: number,
  onMs: number,
  offMs: number,
|};

export type Progress = {|
  max: number,
  progress: number,
  indeterminate: boolean,
|};

export type SmallIcon = {|
  icon: string,
  level?: number,
|};

export type AndroidAllowDataType = {
  allow: boolean,
  mimeType: string,
};

export type NativeAndroidRemoteInput = {|
  allowedDataTypes: AndroidAllowDataType[],
  allowFreeFormInput?: boolean,
  choices: string[],
  label?: string,
  resultKey: string,
|};

export type NativeAndroidAction = {|
  action: string,
  allowGeneratedReplies?: boolean,
  icon: string,
  remoteInputs: NativeAndroidRemoteInput[],
  semanticAction?: SemanticActionType,
  showUserInterface?: boolean,
  title: string,
|};

export type NativeAndroidNotification = {|
  actions?: NativeAndroidAction[],
  autoCancel?: boolean,
  badgeIconType?: BadgeIconTypeType,
  bigPicture?: BigPicture,
  bigText?: BigText,
  category?: CategoryType,
  channelId: string,
  clickAction?: string,
  color?: string,
  colorized?: boolean,
  contentInfo?: string,
  defaults?: DefaultsType[],
  group?: string,
  groupAlertBehaviour?: GroupAlertType,
  groupSummary?: boolean,
  largeIcon?: string,
  lights?: Lights,
  localOnly?: boolean,
  number?: number,
  ongoing?: boolean,
  onlyAlertOnce?: boolean,
  people: string[],
  priority?: PriorityType,
  progress?: Progress,
  // publicVersion: Notification,
  remoteInputHistory?: string[],
  shortcutId?: string,
  showWhen?: boolean,
  smallIcon: SmallIcon,
  sortKey?: string,
  // TODO: style: Style,
  tag?: string,
  ticker?: string,
  timeoutAfter?: number,
  usesChronometer?: boolean,
  vibrate?: number[],
  visibility?: VisibilityType,
  when?: number,
|};

export type IOSAttachmentOptions = {|
  typeHint: string,
  thumbnailHidden: boolean,
  thumbnailClippingRect: {
    height: number,
    width: number,
    x: number,
    y: number,
  },
  thumbnailTime: number,
|};

export type IOSAttachment = {|
  identifier: string,
  options?: IOSAttachmentOptions,
  url: string,
|};

export type NativeIOSNotification = {|
  alertAction?: string,
  attachments: IOSAttachment[],
  badge?: number,
  category?: string,
  hasAction?: boolean,
  launchImage?: string,
  threadIdentifier?: string,
|};

export type Schedule = {|
  exact?: boolean,
  fireDate: number,
  repeatInterval?: 'minute' | 'hour' | 'day' | 'week',
|};

export type NativeNotification = {|
  android?: NativeAndroidNotification,
  body: string,
  data: { [string]: string },
  ios?: NativeIOSNotification,
  notificationId: string,
  schedule?: Schedule,
  sound?: string,
  subtitle?: string,
  title: string,
|};

export type NativeNotificationOpen = {|
  action: string,
  notification: NativeNotification,
  results?: { [string]: string },
|};

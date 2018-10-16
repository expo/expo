/**
 * @flow
 * AndroidNotification representation wrapper
 */
import AndroidAction, { fromNativeAndroidAction } from './AndroidAction';
import { BadgeIconType, Category, GroupAlert, Priority } from './types';
import type Notification from './Notification';
import type {
  BadgeIconTypeType,
  BigPicture,
  BigText,
  CategoryType,
  DefaultsType,
  GroupAlertType,
  Lights,
  NativeAndroidNotification,
  PriorityType,
  Progress,
  SmallIcon,
  VisibilityType,
} from './types';

export default class AndroidNotification {
  _actions: AndroidAction[];

  _autoCancel: boolean | void;

  _badgeIconType: BadgeIconTypeType | void;

  _bigPicture: BigPicture | void;

  _bigText: BigText | void;

  _category: CategoryType | void;

  _channelId: string;

  _clickAction: string | void;

  _color: string | void;

  _colorized: boolean | void;

  _contentInfo: string | void;

  _defaults: DefaultsType[] | void;

  _group: string | void;

  _groupAlertBehaviour: GroupAlertType | void;

  _groupSummary: boolean | void;

  _largeIcon: string | void;

  _lights: Lights | void;

  _localOnly: boolean | void;

  _notification: Notification;

  _number: number | void;

  _ongoing: boolean | void;

  _onlyAlertOnce: boolean | void;

  _people: string[];

  _priority: PriorityType | void;

  _progress: Progress | void;

  // _publicVersion: Notification;
  _remoteInputHistory: string[] | void;

  _shortcutId: string | void;

  _showWhen: boolean | void;

  _smallIcon: SmallIcon;

  _sortKey: string | void;

  // TODO: style: Style; // Need to figure out if this can work
  _tag: string | void;

  _ticker: string | void;

  _timeoutAfter: number | void;

  _usesChronometer: boolean | void;

  _vibrate: number[] | void;

  _visibility: VisibilityType | void;

  _when: number | void;

  // android unsupported
  // content: RemoteViews
  // contentIntent: PendingIntent - need to look at what this is
  // customBigContentView: RemoteViews
  // customContentView: RemoteViews
  // customHeadsUpContentView: RemoteViews
  // deleteIntent: PendingIntent
  // fullScreenIntent: PendingIntent
  // sound.streamType

  constructor(notification: Notification, data?: NativeAndroidNotification) {
    this._notification = notification;

    if (data) {
      this._actions = data.actions
        ? data.actions.map(action => fromNativeAndroidAction(action))
        : [];
      this._autoCancel = data.autoCancel;
      this._badgeIconType = data.badgeIconType;
      this._bigPicture = data.bigPicture;
      this._bigText = data.bigText;
      this._category = data.category;
      this._channelId = data.channelId;
      this._clickAction = data.clickAction;
      this._color = data.color;
      this._colorized = data.colorized;
      this._contentInfo = data.contentInfo;
      this._defaults = data.defaults;
      this._group = data.group;
      this._groupAlertBehaviour = data.groupAlertBehaviour;
      this._groupSummary = data.groupSummary;
      this._largeIcon = data.largeIcon;
      this._lights = data.lights;
      this._localOnly = data.localOnly;
      this._number = data.number;
      this._ongoing = data.ongoing;
      this._onlyAlertOnce = data.onlyAlertOnce;
      this._people = data.people;
      this._priority = data.priority;
      this._progress = data.progress;
      // _publicVersion: Notification;
      this._remoteInputHistory = data.remoteInputHistory;
      this._shortcutId = data.shortcutId;
      this._showWhen = data.showWhen;
      this._smallIcon = data.smallIcon;
      this._sortKey = data.sortKey;
      this._tag = data.tag;
      this._ticker = data.ticker;
      this._timeoutAfter = data.timeoutAfter;
      this._usesChronometer = data.usesChronometer;
      this._vibrate = data.vibrate;
      this._visibility = data.visibility;
      this._when = data.when;
    }

    // Defaults
    this._actions = this._actions || [];
    this._people = this._people || [];
    this._smallIcon = this._smallIcon || {
      icon: 'ic_launcher',
    };
  }

  get actions(): AndroidAction[] {
    return this._actions;
  }

  get autoCancel(): ?boolean {
    return this._autoCancel;
  }

  get badgeIconType(): ?BadgeIconTypeType {
    return this._badgeIconType;
  }

  get bigPicture(): ?BigPicture {
    return this._bigPicture;
  }

  get bigText(): ?BigText {
    return this._bigText;
  }

  get category(): ?CategoryType {
    return this._category;
  }

  get channelId(): string {
    return this._channelId;
  }

  get clickAction(): ?string {
    return this._clickAction;
  }

  get color(): ?string {
    return this._color;
  }

  get colorized(): ?boolean {
    return this._colorized;
  }

  get contentInfo(): ?string {
    return this._contentInfo;
  }

  get defaults(): ?(DefaultsType[]) {
    return this._defaults;
  }

  get group(): ?string {
    return this._group;
  }

  get groupAlertBehaviour(): ?GroupAlertType {
    return this._groupAlertBehaviour;
  }

  get groupSummary(): ?boolean {
    return this._groupSummary;
  }

  get largeIcon(): ?string {
    return this._largeIcon;
  }

  get lights(): ?Lights {
    return this._lights;
  }

  get localOnly(): ?boolean {
    return this._localOnly;
  }

  get number(): ?number {
    return this._number;
  }

  get ongoing(): ?boolean {
    return this._ongoing;
  }

  get onlyAlertOnce(): ?boolean {
    return this._onlyAlertOnce;
  }

  get people(): string[] {
    return this._people;
  }

  get priority(): ?PriorityType {
    return this._priority;
  }

  get progress(): ?Progress {
    return this._progress;
  }

  get remoteInputHistory(): ?(string[]) {
    return this._remoteInputHistory;
  }

  get shortcutId(): ?string {
    return this._shortcutId;
  }

  get showWhen(): ?boolean {
    return this._showWhen;
  }

  get smallIcon(): SmallIcon {
    return this._smallIcon;
  }

  get sortKey(): ?string {
    return this._sortKey;
  }

  get tag(): ?string {
    return this._tag;
  }

  get ticker(): ?string {
    return this._ticker;
  }

  get timeoutAfter(): ?number {
    return this._timeoutAfter;
  }

  get usesChronometer(): ?boolean {
    return this._usesChronometer;
  }

  get vibrate(): ?(number[]) {
    return this._vibrate;
  }

  get visibility(): ?VisibilityType {
    return this._visibility;
  }

  get when(): ?number {
    return this._when;
  }

  /**
   *
   * @param action
   * @returns {Notification}
   */
  addAction(action: AndroidAction): Notification {
    if (!(action instanceof AndroidAction)) {
      throw new Error(
        `AndroidNotification:addAction expects an 'AndroidAction' but got type ${typeof action}`
      );
    }
    this._actions.push(action);
    return this._notification;
  }

  /**
   *
   * @param person
   * @returns {Notification}
   */
  addPerson(person: string): Notification {
    this._people.push(person);
    return this._notification;
  }

  /**
   *
   * @param autoCancel
   * @returns {Notification}
   */
  setAutoCancel(autoCancel: boolean): Notification {
    this._autoCancel = autoCancel;
    return this._notification;
  }

  /**
   *
   * @param badgeIconType
   * @returns {Notification}
   */
  setBadgeIconType(badgeIconType: BadgeIconTypeType): Notification {
    if (!Object.values(BadgeIconType).includes(badgeIconType)) {
      throw new Error(
        `AndroidNotification:setBadgeIconType Invalid BadgeIconType: ${badgeIconType}`
      );
    }
    this._badgeIconType = badgeIconType;
    return this._notification;
  }

  setBigPicture(
    picture: string,
    largeIcon?: string,
    contentTitle?: string,
    summaryText?: string
  ): Notification {
    this._bigPicture = {
      contentTitle,
      largeIcon,
      picture,
      summaryText,
    };
    return this._notification;
  }

  setBigText(
    text: string,
    contentTitle?: string,
    summaryText?: string
  ): Notification {
    this._bigText = {
      contentTitle,
      summaryText,
      text,
    };
    return this._notification;
  }

  /**
   *
   * @param category
   * @returns {Notification}
   */
  setCategory(category: CategoryType): Notification {
    if (!Object.values(Category).includes(category)) {
      throw new Error(
        `AndroidNotification:setCategory Invalid Category: ${category}`
      );
    }
    this._category = category;
    return this._notification;
  }

  /**
   *
   * @param channelId
   * @returns {Notification}
   */
  setChannelId(channelId: string): Notification {
    this._channelId = channelId;
    return this._notification;
  }

  /**
   *
   * @param clickAction
   * @returns {Notification}
   */
  setClickAction(clickAction: string): Notification {
    this._clickAction = clickAction;
    return this._notification;
  }

  /**
   *
   * @param color
   * @returns {Notification}
   */
  setColor(color: string): Notification {
    this._color = color;
    return this._notification;
  }

  /**
   *
   * @param colorized
   * @returns {Notification}
   */
  setColorized(colorized: boolean): Notification {
    this._colorized = colorized;
    return this._notification;
  }

  /**
   *
   * @param contentInfo
   * @returns {Notification}
   */
  setContentInfo(contentInfo: string): Notification {
    this._contentInfo = contentInfo;
    return this._notification;
  }

  /**
   *
   * @param defaults
   * @returns {Notification}
   */
  setDefaults(defaults: DefaultsType[]): Notification {
    this._defaults = defaults;
    return this._notification;
  }

  /**
   *
   * @param group
   * @returns {Notification}
   */
  setGroup(group: string): Notification {
    this._group = group;
    return this._notification;
  }

  /**
   *
   * @param groupAlertBehaviour
   * @returns {Notification}
   */
  setGroupAlertBehaviour(groupAlertBehaviour: GroupAlertType): Notification {
    if (!Object.values(GroupAlert).includes(groupAlertBehaviour)) {
      throw new Error(
        `AndroidNotification:setGroupAlertBehaviour Invalid GroupAlert: ${groupAlertBehaviour}`
      );
    }
    this._groupAlertBehaviour = groupAlertBehaviour;
    return this._notification;
  }

  /**
   *
   * @param groupSummary
   * @returns {Notification}
   */
  setGroupSummary(groupSummary: boolean): Notification {
    this._groupSummary = groupSummary;
    return this._notification;
  }

  /**
   *
   * @param largeIcon
   * @returns {Notification}
   */
  setLargeIcon(largeIcon: string): Notification {
    this._largeIcon = largeIcon;
    return this._notification;
  }

  /**
   *
   * @param argb
   * @param onMs
   * @param offMs
   * @returns {Notification}
   */
  setLights(argb: number, onMs: number, offMs: number): Notification {
    this._lights = {
      argb,
      onMs,
      offMs,
    };
    return this._notification;
  }

  /**
   *
   * @param localOnly
   * @returns {Notification}
   */
  setLocalOnly(localOnly: boolean): Notification {
    this._localOnly = localOnly;
    return this._notification;
  }

  /**
   *
   * @param number
   * @returns {Notification}
   */
  setNumber(number: number): Notification {
    this._number = number;
    return this._notification;
  }

  /**
   *
   * @param ongoing
   * @returns {Notification}
   */
  setOngoing(ongoing: boolean): Notification {
    this._ongoing = ongoing;
    return this._notification;
  }

  /**
   *
   * @param onlyAlertOnce
   * @returns {Notification}
   */
  setOnlyAlertOnce(onlyAlertOnce: boolean): Notification {
    this._onlyAlertOnce = onlyAlertOnce;
    return this._notification;
  }

  /**
   *
   * @param priority
   * @returns {Notification}
   */
  setPriority(priority: PriorityType): Notification {
    if (!Object.values(Priority).includes(priority)) {
      throw new Error(
        `AndroidNotification:setPriority Invalid Priority: ${priority}`
      );
    }
    this._priority = priority;
    return this._notification;
  }

  /**
   *
   * @param max
   * @param progress
   * @param indeterminate
   * @returns {Notification}
   */
  setProgress(
    max: number,
    progress: number,
    indeterminate: boolean
  ): Notification {
    this._progress = {
      max,
      progress,
      indeterminate,
    };
    return this._notification;
  }

  /**
   *
   * @param publicVersion
   * @returns {Notification}
   */
  /* setPublicVersion(publicVersion: Notification): Notification {
    this._publicVersion = publicVersion;
    return this._notification;
  } */

  /**
   *
   * @param remoteInputHistory
   * @returns {Notification}
   */
  setRemoteInputHistory(remoteInputHistory: string[]): Notification {
    this._remoteInputHistory = remoteInputHistory;
    return this._notification;
  }

  /**
   *
   * @param shortcutId
   * @returns {Notification}
   */
  setShortcutId(shortcutId: string): Notification {
    this._shortcutId = shortcutId;
    return this._notification;
  }

  /**
   *
   * @param showWhen
   * @returns {Notification}
   */
  setShowWhen(showWhen: boolean): Notification {
    this._showWhen = showWhen;
    return this._notification;
  }

  /**
   *
   * @param icon
   * @param level
   * @returns {Notification}
   */
  setSmallIcon(icon: string, level?: number): Notification {
    this._smallIcon = {
      icon,
      level,
    };
    return this._notification;
  }

  /**
   *
   * @param sortKey
   * @returns {Notification}
   */
  setSortKey(sortKey: string): Notification {
    this._sortKey = sortKey;
    return this._notification;
  }

  /**
   *
   * @param tag
   * @returns {Notification}
   */
  setTag(tag: string): Notification {
    this._tag = tag;
    return this._notification;
  }

  /**
   *
   * @param ticker
   * @returns {Notification}
   */
  setTicker(ticker: string): Notification {
    this._ticker = ticker;
    return this._notification;
  }

  /**
   *
   * @param timeoutAfter
   * @returns {Notification}
   */
  setTimeoutAfter(timeoutAfter: number): Notification {
    this._timeoutAfter = timeoutAfter;
    return this._notification;
  }

  /**
   *
   * @param usesChronometer
   * @returns {Notification}
   */
  setUsesChronometer(usesChronometer: boolean): Notification {
    this._usesChronometer = usesChronometer;
    return this._notification;
  }

  /**
   *
   * @param vibrate
   * @returns {Notification}
   */
  setVibrate(vibrate: number[]): Notification {
    this._vibrate = vibrate;
    return this._notification;
  }

  /**
   *
   * @param visibility
   * @returns {Notification}
   */
  setVisibility(visibility: VisibilityType): Notification {
    this._visibility = visibility;
    return this._notification;
  }

  /**
   *
   * @param when
   * @returns {Notification}
   */
  setWhen(when: number): Notification {
    this._when = when;
    return this._notification;
  }

  build(): NativeAndroidNotification {
    // TODO: Validation of required fields
    if (!this._channelId) {
      throw new Error(
        'AndroidNotification: Missing required `channelId` property'
      );
    } else if (!this._smallIcon) {
      throw new Error(
        'AndroidNotification: Missing required `smallIcon` property'
      );
    }

    return {
      actions: this._actions.map(action => action.build()),
      autoCancel: this._autoCancel,
      badgeIconType: this._badgeIconType,
      bigPicture: this._bigPicture,
      bigText: this._bigText,
      category: this._category,
      channelId: this._channelId,
      clickAction: this._clickAction,
      color: this._color,
      colorized: this._colorized,
      contentInfo: this._contentInfo,
      defaults: this._defaults,
      group: this._group,
      groupAlertBehaviour: this._groupAlertBehaviour,
      groupSummary: this._groupSummary,
      largeIcon: this._largeIcon,
      lights: this._lights,
      localOnly: this._localOnly,
      number: this._number,
      ongoing: this._ongoing,
      onlyAlertOnce: this._onlyAlertOnce,
      people: this._people,
      priority: this._priority,
      progress: this._progress,
      // publicVersion: this._publicVersion,
      remoteInputHistory: this._remoteInputHistory,
      shortcutId: this._shortcutId,
      showWhen: this._showWhen,
      smallIcon: this._smallIcon,
      sortKey: this._sortKey,
      // TODO: style: Style,
      tag: this._tag,
      ticker: this._ticker,
      timeoutAfter: this._timeoutAfter,
      usesChronometer: this._usesChronometer,
      vibrate: this._vibrate,
      visibility: this._visibility,
      when: this._when,
    };
  }
}

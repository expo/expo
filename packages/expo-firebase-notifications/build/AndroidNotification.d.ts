import AndroidAction from './AndroidAction';
import { BadgeIconType, Category, GroupAlert, Priority, Notification, BigPicture, BigText, Defaults, InboxStyle, Lights, NativeAndroidNotification, Progress, SmallIcon, Visibility } from './types';
export default class AndroidNotification {
    _actions: AndroidAction[];
    _autoCancel?: boolean;
    _badgeIconType?: BadgeIconType;
    _bigPicture?: BigPicture;
    _bigText?: BigText;
    _category?: Category;
    _channelId?: string;
    _clickAction?: string;
    _color?: string;
    _colorized?: boolean;
    _contentInfo?: string;
    _defaults?: Defaults[];
    _group?: string;
    _groupAlertBehaviour?: GroupAlert;
    _groupSummary?: boolean;
    _inboxStyle?: InboxStyle;
    _largeIcon?: string;
    _lights?: Lights;
    _localOnly?: boolean;
    _notification: Notification;
    _number?: number;
    _ongoing?: boolean;
    _onlyAlertOnce?: boolean;
    _people: string[];
    _priority?: Priority;
    _progress?: Progress;
    _remoteInputHistory?: string[];
    _shortcutId?: string;
    _showWhen?: boolean;
    _smallIcon: SmallIcon;
    _sortKey?: string;
    _tag?: string;
    _ticker?: string;
    _timeoutAfter?: number;
    _usesChronometer?: boolean;
    _vibrate?: number[];
    _visibility?: Visibility;
    _when?: number;
    constructor(notification: Notification, data?: NativeAndroidNotification);
    readonly inboxStyle: InboxStyle | undefined;
    readonly actions: AndroidAction[];
    readonly autoCancel: boolean | undefined;
    readonly badgeIconType: BadgeIconType | undefined;
    readonly bigPicture: BigPicture | undefined;
    readonly bigText: BigText | undefined;
    readonly category: Category | undefined;
    readonly channelId: string | undefined;
    readonly clickAction: string | undefined;
    readonly color: string | undefined;
    readonly colorized: boolean | undefined;
    readonly contentInfo: string | undefined;
    readonly defaults: (Defaults[]) | undefined;
    readonly group: string | undefined;
    readonly groupAlertBehaviour: GroupAlert | undefined;
    readonly groupSummary: boolean | undefined;
    readonly largeIcon: string | undefined;
    readonly lights: Lights | undefined;
    readonly localOnly: boolean | undefined;
    readonly number: number | undefined;
    readonly ongoing: boolean | undefined;
    readonly onlyAlertOnce: boolean | undefined;
    readonly people: string[];
    readonly priority: Priority | undefined;
    readonly progress: Progress | undefined;
    readonly remoteInputHistory: (string[]) | undefined;
    readonly shortcutId: string | undefined;
    readonly showWhen: boolean | undefined;
    readonly smallIcon: SmallIcon;
    readonly sortKey: string | undefined;
    readonly tag: string | undefined;
    readonly ticker: string | undefined;
    readonly timeoutAfter: number | undefined;
    readonly usesChronometer: boolean | undefined;
    readonly vibrate: (number[]) | undefined;
    readonly visibility: Visibility | undefined;
    readonly when: number | undefined;
    /**
     *
     * @param lines
     * @param contentTitle
     * @param summaryText
     * @returns {Notification}
     */
    setInboxStyle(lines: string[], contentTitle?: string, summaryText?: string): Notification;
    /**
     *
     * @param action
     * @returns {Notification}
     */
    addAction(action: AndroidAction): Notification;
    /**
     *
     * @param person
     * @returns {Notification}
     */
    addPerson(person: string): Notification;
    /**
     *
     * @param autoCancel
     * @returns {Notification}
     */
    setAutoCancel(autoCancel: boolean): Notification;
    /**
     *
     * @param badgeIconType
     * @returns {Notification}
     */
    setBadgeIconType(badgeIconType: BadgeIconType): Notification;
    setBigPicture(picture: string, largeIcon?: string, contentTitle?: string, summaryText?: string): Notification;
    setBigText(text: string, contentTitle?: string, summaryText?: string): Notification;
    /**
     *
     * @param category
     * @returns {Notification}
     */
    setCategory(category: Category): Notification;
    /**
     *
     * @param channelId
     * @returns {Notification}
     */
    setChannelId(channelId: string): Notification;
    /**
     *
     * @param clickAction
     * @returns {Notification}
     */
    setClickAction(clickAction: string): Notification;
    /**
     *
     * @param color
     * @returns {Notification}
     */
    setColor(color: string): Notification;
    /**
     *
     * @param colorized
     * @returns {Notification}
     */
    setColorized(colorized: boolean): Notification;
    /**
     *
     * @param contentInfo
     * @returns {Notification}
     */
    setContentInfo(contentInfo: string): Notification;
    /**
     *
     * @param defaults
     * @returns {Notification}
     */
    setDefaults(defaults: Defaults[]): Notification;
    /**
     *
     * @param group
     * @returns {Notification}
     */
    setGroup(group: string): Notification;
    /**
     *
     * @param groupAlertBehaviour
     * @returns {Notification}
     */
    setGroupAlertBehaviour(groupAlertBehaviour: GroupAlert): Notification;
    /**
     *
     * @param groupSummary
     * @returns {Notification}
     */
    setGroupSummary(groupSummary: boolean): Notification;
    /**
     *
     * @param largeIcon
     * @returns {Notification}
     */
    setLargeIcon(largeIcon: string): Notification;
    /**
     *
     * @param argb
     * @param onMs
     * @param offMs
     * @returns {Notification}
     */
    setLights(argb: number, onMs: number, offMs: number): Notification;
    /**
     *
     * @param localOnly
     * @returns {Notification}
     */
    setLocalOnly(localOnly: boolean): Notification;
    /**
     *
     * @param number
     * @returns {Notification}
     */
    setNumber(number: number): Notification;
    /**
     *
     * @param ongoing
     * @returns {Notification}
     */
    setOngoing(ongoing: boolean): Notification;
    /**
     *
     * @param onlyAlertOnce
     * @returns {Notification}
     */
    setOnlyAlertOnce(onlyAlertOnce: boolean): Notification;
    /**
     *
     * @param priority
     * @returns {Notification}
     */
    setPriority(priority: Priority): Notification;
    /**
     *
     * @param max
     * @param progress
     * @param indeterminate
     * @returns {Notification}
     */
    setProgress(max: number, progress: number, indeterminate: boolean): Notification;
    /**
     *
     * @param publicVersion
     * @returns {Notification}
     */
    /**
     *
     * @param remoteInputHistory
     * @returns {Notification}
     */
    setRemoteInputHistory(remoteInputHistory: string[]): Notification;
    /**
     *
     * @param shortcutId
     * @returns {Notification}
     */
    setShortcutId(shortcutId: string): Notification;
    /**
     *
     * @param showWhen
     * @returns {Notification}
     */
    setShowWhen(showWhen: boolean): Notification;
    /**
     *
     * @param icon
     * @param level
     * @returns {Notification}
     */
    setSmallIcon(icon: string, level?: number): Notification;
    /**
     *
     * @param sortKey
     * @returns {Notification}
     */
    setSortKey(sortKey: string): Notification;
    /**
     *
     * @param tag
     * @returns {Notification}
     */
    setTag(tag: string): Notification;
    /**
     *
     * @param ticker
     * @returns {Notification}
     */
    setTicker(ticker: string): Notification;
    /**
     *
     * @param timeoutAfter
     * @returns {Notification}
     */
    setTimeoutAfter(timeoutAfter: number): Notification;
    /**
     *
     * @param usesChronometer
     * @returns {Notification}
     */
    setUsesChronometer(usesChronometer: boolean): Notification;
    /**
     *
     * @param vibrate
     * @returns {Notification}
     */
    setVibrate(vibrate: number[]): Notification;
    /**
     *
     * @param visibility
     * @returns {Notification}
     */
    setVisibility(visibility: Visibility): Notification;
    /**
     *
     * @param when
     * @returns {Notification}
     */
    setWhen(when: number): Notification;
    build(): NativeAndroidNotification;
}

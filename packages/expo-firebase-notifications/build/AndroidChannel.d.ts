import { Importance, Visibility, NativeAndroidChannel } from './types';
export default class AndroidChannel {
    _bypassDnd?: boolean;
    _channelId: string;
    _description?: string;
    _group?: string;
    _importance: Importance;
    _lightColor?: string;
    _lightsEnabled?: boolean;
    _lockScreenVisibility?: Visibility;
    _name: string;
    _showBadge?: boolean;
    _sound?: string;
    _vibrationEnabled?: boolean;
    _vibrationPattern?: number[];
    constructor(channelId: string, name: string, importance: Importance);
    readonly bypassDnd: boolean | undefined;
    readonly channelId: string;
    readonly description: string | undefined;
    readonly group: string | undefined;
    readonly importance: Importance;
    readonly lightColor: string | undefined;
    readonly lightsEnabled: boolean | undefined;
    readonly lockScreenVisibility: Visibility | undefined;
    readonly name: string;
    readonly showBadge: boolean | undefined;
    readonly sound: string | undefined;
    readonly vibrationEnabled: boolean | undefined;
    readonly vibrationPattern: number[] | undefined;
    /**
     *
     * @param lightsEnabled
     * @returns {AndroidChannel}
     */
    enableLights(lightsEnabled: boolean): AndroidChannel;
    /**
     *
     * @param vibrationEnabled
     * @returns {AndroidChannel}
     */
    enableVibration(vibrationEnabled: boolean): AndroidChannel;
    /**
     *
     * @param bypassDnd
     * @returns {AndroidChannel}
     */
    setBypassDnd(bypassDnd: boolean): AndroidChannel;
    /**
     *
     * @param description
     * @returns {AndroidChannel}
     */
    setDescription(description: string): AndroidChannel;
    /**
     *
     * @param group
     * @returns {AndroidChannel}
     */
    setGroup(groupId: string): AndroidChannel;
    /**
     *
     * @param lightColor
     * @returns {AndroidChannel}
     */
    setLightColor(lightColor: string): AndroidChannel;
    /**
     *
     * @param lockScreenVisibility
     * @returns {AndroidChannel}
     */
    setLockScreenVisibility(lockScreenVisibility: Visibility): AndroidChannel;
    /**
     *
     * @param showBadge
     * @returns {AndroidChannel}
     */
    setShowBadge(showBadge: boolean): AndroidChannel;
    /**
     *
     * @param sound
     * @returns {AndroidChannel}
     */
    setSound(sound: string): AndroidChannel;
    /**
     *
     * @param vibrationPattern
     * @returns {AndroidChannel}
     */
    setVibrationPattern(vibrationPattern: number[]): AndroidChannel;
    build(): NativeAndroidChannel;
}

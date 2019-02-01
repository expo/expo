import invariant from 'invariant';
import { Importance, Visibility } from './types';
export default class AndroidChannel {
    constructor(channelId, name, importance) {
        invariant(Object.values(Importance).includes(importance), `AndroidChannel() Invalid Importance: ${importance}`);
        this._channelId = channelId;
        this._name = name;
        this._importance = importance;
    }
    get bypassDnd() {
        return this._bypassDnd;
    }
    get channelId() {
        return this._channelId;
    }
    get description() {
        return this._description;
    }
    get group() {
        return this._group;
    }
    get importance() {
        return this._importance;
    }
    get lightColor() {
        return this._lightColor;
    }
    get lightsEnabled() {
        return this._lightsEnabled;
    }
    get lockScreenVisibility() {
        return this._lockScreenVisibility;
    }
    get name() {
        return this._name;
    }
    get showBadge() {
        return this._showBadge;
    }
    get sound() {
        return this._sound;
    }
    get vibrationEnabled() {
        return this._vibrationEnabled;
    }
    get vibrationPattern() {
        return this._vibrationPattern;
    }
    /**
     *
     * @param lightsEnabled
     * @returns {AndroidChannel}
     */
    enableLights(lightsEnabled) {
        this._lightsEnabled = lightsEnabled;
        return this;
    }
    /**
     *
     * @param vibrationEnabled
     * @returns {AndroidChannel}
     */
    enableVibration(vibrationEnabled) {
        this._vibrationEnabled = vibrationEnabled;
        return this;
    }
    /**
     *
     * @param bypassDnd
     * @returns {AndroidChannel}
     */
    setBypassDnd(bypassDnd) {
        this._bypassDnd = bypassDnd;
        return this;
    }
    /**
     *
     * @param description
     * @returns {AndroidChannel}
     */
    setDescription(description) {
        this._description = description;
        return this;
    }
    /**
     *
     * @param group
     * @returns {AndroidChannel}
     */
    setGroup(groupId) {
        this._group = groupId;
        return this;
    }
    /**
     *
     * @param lightColor
     * @returns {AndroidChannel}
     */
    setLightColor(lightColor) {
        this._lightColor = lightColor;
        return this;
    }
    /**
     *
     * @param lockScreenVisibility
     * @returns {AndroidChannel}
     */
    setLockScreenVisibility(lockScreenVisibility) {
        invariant(Object.values(Visibility).includes(lockScreenVisibility), `AndroidChannel:setLockScreenVisibility Invalid Visibility: ${lockScreenVisibility}`);
        this._lockScreenVisibility = lockScreenVisibility;
        return this;
    }
    /**
     *
     * @param showBadge
     * @returns {AndroidChannel}
     */
    setShowBadge(showBadge) {
        this._showBadge = showBadge;
        return this;
    }
    /**
     *
     * @param sound
     * @returns {AndroidChannel}
     */
    setSound(sound) {
        this._sound = sound;
        return this;
    }
    /**
     *
     * @param vibrationPattern
     * @returns {AndroidChannel}
     */
    setVibrationPattern(vibrationPattern) {
        this._vibrationPattern = vibrationPattern;
        return this;
    }
    build() {
        invariant(this._channelId, 'AndroidChannel: Missing required `channelId` property');
        invariant(this._importance, 'AndroidChannel: Missing required `importance` property');
        invariant(this._name, 'AndroidChannel: Missing required `name` property');
        return {
            bypassDnd: this._bypassDnd,
            channelId: this._channelId,
            description: this._description,
            group: this._group,
            importance: this._importance,
            lightColor: this._lightColor,
            lightsEnabled: this._lightsEnabled,
            lockScreenVisibility: this._lockScreenVisibility,
            name: this._name,
            showBadge: this._showBadge,
            sound: this._sound,
            vibrationEnabled: this._vibrationEnabled,
            vibrationPattern: this._vibrationPattern,
        };
    }
}
//# sourceMappingURL=AndroidChannel.js.map
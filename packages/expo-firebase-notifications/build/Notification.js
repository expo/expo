import invariant from 'invariant';
import { Platform } from '@unimodules/core';
import { utils } from 'expo-firebase-app';
import AndroidNotification from './AndroidNotification';
import IOSNotification from './IOSNotification';
const { generatePushID, isObject } = utils;
export default class Notification {
    constructor(nativeNotification, notifications) {
        this._body = '';
        // alertBody | body | contentText
        this._data = {};
        // N/A | subtitle | subText
        this._title = ''; // alertTitle | title | contentTitle
        if (nativeNotification) {
            this._body = nativeNotification.body;
            this._data = nativeNotification.data;
            this._notificationId = nativeNotification.notificationId;
            this._sound = nativeNotification.sound;
            this._subtitle = nativeNotification.subtitle;
            this._title = nativeNotification.title;
        }
        this._android = new AndroidNotification(this, nativeNotification && nativeNotification.android);
        this._ios = new IOSNotification(this, notifications, nativeNotification && nativeNotification.ios);
        // Defaults
        this._data = this._data || {};
        // TODO: Is this the best way to generate an ID?
        this._notificationId = this._notificationId || generatePushID();
    }
    get android() {
        return this._android;
    }
    get body() {
        return this._body;
    }
    get data() {
        return this._data;
    }
    get ios() {
        return this._ios;
    }
    get notificationId() {
        return this._notificationId;
    }
    get sound() {
        return this._sound;
    }
    get subtitle() {
        return this._subtitle;
    }
    get title() {
        return this._title;
    }
    /**
     *
     * @param body
     * @returns {Notification}
     */
    setBody(body) {
        this._body = body;
        return this;
    }
    /**
     *
     * @param data
     * @returns {Notification}
     */
    setData(data = {}) {
        invariant(isObject(data), `Notification:withData expects an object but got type '${typeof data}'.`);
        this._data = data;
        return this;
    }
    /**
     *
     * @param notificationId
     * @returns {Notification}
     */
    setNotificationId(notificationId) {
        this._notificationId = notificationId;
        return this;
    }
    /**
     *
     * @param sound
     * @returns {Notification}
     */
    setSound(sound) {
        this._sound = sound;
        return this;
    }
    /**
     *
     * @param subtitle
     * @returns {Notification}
     */
    setSubtitle(subtitle) {
        this._subtitle = subtitle;
        return this;
    }
    /**
     *
     * @param title
     * @returns {Notification}
     */
    setTitle(title) {
        this._title = title;
        return this;
    }
    build() {
        if (!this._notificationId)
            throw new Error('Notification: Missing required `notificationId` property');
        return {
            android: Platform.OS === 'android' ? this._android.build() : undefined,
            body: this._body,
            data: this._data,
            ios: Platform.OS === 'ios' ? this._ios.build() : undefined,
            notificationId: this._notificationId,
            sound: this._sound,
            subtitle: this._subtitle,
            title: this._title,
        };
    }
}
//# sourceMappingURL=Notification.js.map
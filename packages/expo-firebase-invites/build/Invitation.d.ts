import AndroidInvitation from './AndroidInvitation';
import { NativeInvitation } from './types';
export default class Invitation {
    _android: AndroidInvitation;
    _androidClientId?: string;
    _androidMinimumVersionCode?: number;
    _callToActionText?: string;
    _customImage?: string;
    _deepLink?: string;
    _iosClientId?: string;
    _message: string;
    _title: string;
    constructor(title: string, message: string);
    readonly android: AndroidInvitation;
    /**
     *
     * @param androidClientId
     * @returns {Invitation}
     */
    setAndroidClientId(androidClientId: string): Invitation;
    /**
     *
     * @param androidMinimumVersionCode
     * @returns {Invitation}
     */
    setAndroidMinimumVersionCode(androidMinimumVersionCode: number): Invitation;
    /**
     *
     * @param callToActionText
     * @returns {Invitation}
     */
    setCallToActionText(callToActionText: string): Invitation;
    /**
     *
     * @param customImage
     * @returns {Invitation}
     */
    setCustomImage(customImage: string): Invitation;
    /**
     *
     * @param deepLink
     * @returns {Invitation}
     */
    setDeepLink(deepLink: string): Invitation;
    /**
     *
     * @param iosClientId
     * @returns {Invitation}
     */
    setIOSClientId(iosClientId: string): Invitation;
    build(): NativeInvitation;
}

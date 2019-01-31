import { Invitation, NativeAndroidInvitation } from './types';
export default class AndroidInvitation {
    _additionalReferralParameters?: {
        [key: string]: string;
    };
    _emailHtmlContent?: string;
    _emailSubject?: string;
    _googleAnalyticsTrackingId?: string;
    _invitation: Invitation;
    constructor(invitation: Invitation);
    /**
     *
     * @param additionalReferralParameters
     * @returns {Invitation}
     */
    setAdditionalReferralParameters(additionalReferralParameters: {
        [key: string]: string;
    }): Invitation;
    /**
     *
     * @param emailHtmlContent
     * @returns {Invitation}
     */
    setEmailHtmlContent(emailHtmlContent: string): Invitation;
    /**
     *
     * @param emailSubject
     * @returns {Invitation}
     */
    setEmailSubject(emailSubject: string): Invitation;
    /**
     *
     * @param googleAnalyticsTrackingId
     * @returns {Invitation}
     */
    setGoogleAnalyticsTrackingId(googleAnalyticsTrackingId: string): Invitation;
    build(): NativeAndroidInvitation;
}

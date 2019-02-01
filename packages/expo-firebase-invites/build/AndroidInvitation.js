export default class AndroidInvitation {
    constructor(invitation) {
        this._invitation = invitation;
    }
    /**
     *
     * @param additionalReferralParameters
     * @returns {Invitation}
     */
    setAdditionalReferralParameters(additionalReferralParameters) {
        this._additionalReferralParameters = additionalReferralParameters;
        return this._invitation;
    }
    /**
     *
     * @param emailHtmlContent
     * @returns {Invitation}
     */
    setEmailHtmlContent(emailHtmlContent) {
        this._emailHtmlContent = emailHtmlContent;
        return this._invitation;
    }
    /**
     *
     * @param emailSubject
     * @returns {Invitation}
     */
    setEmailSubject(emailSubject) {
        this._emailSubject = emailSubject;
        return this._invitation;
    }
    /**
     *
     * @param googleAnalyticsTrackingId
     * @returns {Invitation}
     */
    setGoogleAnalyticsTrackingId(googleAnalyticsTrackingId) {
        this._googleAnalyticsTrackingId = googleAnalyticsTrackingId;
        return this._invitation;
    }
    build() {
        return {
            additionalReferralParameters: this._additionalReferralParameters,
            emailHtmlContent: this._emailHtmlContent,
            emailSubject: this._emailSubject,
            googleAnalyticsTrackingId: this._googleAnalyticsTrackingId,
        };
    }
}
//# sourceMappingURL=AndroidInvitation.js.map
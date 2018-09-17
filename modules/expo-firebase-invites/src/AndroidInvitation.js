/**
 * @flow
 * AndroidInvitation representation wrapper
 */
import type Invitation from './Invitation';
import type { NativeAndroidInvitation } from './types';

export default class AndroidInvitation {
  _additionalReferralParameters: { [string]: string } | void;

  _emailHtmlContent: string | void;

  _emailSubject: string | void;

  _googleAnalyticsTrackingId: string | void;

  _invitation: Invitation;

  constructor(invitation: Invitation) {
    this._invitation = invitation;
  }

  /**
   *
   * @param additionalReferralParameters
   * @returns {Invitation}
   */
  setAdditionalReferralParameters(additionalReferralParameters: {
    [string]: string,
  }): Invitation {
    this._additionalReferralParameters = additionalReferralParameters;
    return this._invitation;
  }

  /**
   *
   * @param emailHtmlContent
   * @returns {Invitation}
   */
  setEmailHtmlContent(emailHtmlContent: string): Invitation {
    this._emailHtmlContent = emailHtmlContent;
    return this._invitation;
  }

  /**
   *
   * @param emailSubject
   * @returns {Invitation}
   */
  setEmailSubject(emailSubject: string): Invitation {
    this._emailSubject = emailSubject;
    return this._invitation;
  }

  /**
   *
   * @param googleAnalyticsTrackingId
   * @returns {Invitation}
   */
  setGoogleAnalyticsTrackingId(googleAnalyticsTrackingId: string): Invitation {
    this._googleAnalyticsTrackingId = googleAnalyticsTrackingId;
    return this._invitation;
  }

  build(): NativeAndroidInvitation {
    return {
      additionalReferralParameters: this._additionalReferralParameters,
      emailHtmlContent: this._emailHtmlContent,
      emailSubject: this._emailSubject,
      googleAnalyticsTrackingId: this._googleAnalyticsTrackingId,
    };
  }
}

// @needsAudit @docsMissing
/**
 * An enum whose values specify scopes you can request when calling [`AppleAuthentication.signInAsync()`](#appleauthenticationsigninasyncoptions).
 *
 * > Note that it is possible that you will not be granted all of the scopes which you request.
 * > You will still need to handle null values for any fields you request.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationscope)
 * for more details.
 */
export var AppleAuthenticationScope;
(function (AppleAuthenticationScope) {
    AppleAuthenticationScope[AppleAuthenticationScope["FULL_NAME"] = 0] = "FULL_NAME";
    AppleAuthenticationScope[AppleAuthenticationScope["EMAIL"] = 1] = "EMAIL";
})(AppleAuthenticationScope || (AppleAuthenticationScope = {}));
// @needsAudit @docsMissing
export var AppleAuthenticationOperation;
(function (AppleAuthenticationOperation) {
    /**
     * An operation that depends on the particular kind of credential provider.
     */
    AppleAuthenticationOperation[AppleAuthenticationOperation["IMPLICIT"] = 0] = "IMPLICIT";
    AppleAuthenticationOperation[AppleAuthenticationOperation["LOGIN"] = 1] = "LOGIN";
    AppleAuthenticationOperation[AppleAuthenticationOperation["REFRESH"] = 2] = "REFRESH";
    AppleAuthenticationOperation[AppleAuthenticationOperation["LOGOUT"] = 3] = "LOGOUT";
})(AppleAuthenticationOperation || (AppleAuthenticationOperation = {}));
// @needsAudit @docsMissing
/**
 * An enum whose values specify state of the credential when checked with [`AppleAuthentication.getCredentialStateAsync()`](#appleauthenticationgetcredentialstateasyncuser).
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovidercredentialstate)
 * for more details.
 */
export var AppleAuthenticationCredentialState;
(function (AppleAuthenticationCredentialState) {
    AppleAuthenticationCredentialState[AppleAuthenticationCredentialState["REVOKED"] = 0] = "REVOKED";
    AppleAuthenticationCredentialState[AppleAuthenticationCredentialState["AUTHORIZED"] = 1] = "AUTHORIZED";
    AppleAuthenticationCredentialState[AppleAuthenticationCredentialState["NOT_FOUND"] = 2] = "NOT_FOUND";
    AppleAuthenticationCredentialState[AppleAuthenticationCredentialState["TRANSFERRED"] = 3] = "TRANSFERRED";
})(AppleAuthenticationCredentialState || (AppleAuthenticationCredentialState = {}));
// @needsAudit
/**
 * An enum whose values specify the system's best guess for how likely the current user is a real person.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asuserdetectionstatus)
 * for more details.
 */
export var AppleAuthenticationUserDetectionStatus;
(function (AppleAuthenticationUserDetectionStatus) {
    /**
     * The system does not support this determination and there is no data.
     */
    AppleAuthenticationUserDetectionStatus[AppleAuthenticationUserDetectionStatus["UNSUPPORTED"] = 0] = "UNSUPPORTED";
    /**
     * The system has not determined whether the user might be a real person.
     */
    AppleAuthenticationUserDetectionStatus[AppleAuthenticationUserDetectionStatus["UNKNOWN"] = 1] = "UNKNOWN";
    /**
     * The user appears to be a real person.
     */
    AppleAuthenticationUserDetectionStatus[AppleAuthenticationUserDetectionStatus["LIKELY_REAL"] = 2] = "LIKELY_REAL";
})(AppleAuthenticationUserDetectionStatus || (AppleAuthenticationUserDetectionStatus = {}));
// @needsAudit
/**
 * An enum whose values control which pre-defined text to use when rendering an [`AppleAuthenticationButton`](#appleauthenticationappleauthenticationbutton).
 */
export var AppleAuthenticationButtonType;
(function (AppleAuthenticationButtonType) {
    /**
     * "Sign in with Apple"
     */
    AppleAuthenticationButtonType[AppleAuthenticationButtonType["SIGN_IN"] = 0] = "SIGN_IN";
    /**
     * "Continue with Apple"
     */
    AppleAuthenticationButtonType[AppleAuthenticationButtonType["CONTINUE"] = 1] = "CONTINUE";
    /**
     * "Sign up with Apple"
     * @platform ios 13.2+
     */
    AppleAuthenticationButtonType[AppleAuthenticationButtonType["SIGN_UP"] = 2] = "SIGN_UP";
})(AppleAuthenticationButtonType || (AppleAuthenticationButtonType = {}));
// @needsAudit
/**
 * An enum whose values control which pre-defined color scheme to use when rendering an [`AppleAuthenticationButton`](#appleauthenticationappleauthenticationbutton).
 */
export var AppleAuthenticationButtonStyle;
(function (AppleAuthenticationButtonStyle) {
    /**
     * White button with black text.
     */
    AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle["WHITE"] = 0] = "WHITE";
    /**
     * White button with a black outline and black text.
     */
    AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle["WHITE_OUTLINE"] = 1] = "WHITE_OUTLINE";
    /**
     * Black button with white text.
     */
    AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle["BLACK"] = 2] = "BLACK";
})(AppleAuthenticationButtonStyle || (AppleAuthenticationButtonStyle = {}));
//# sourceMappingURL=AppleAuthentication.types.js.map
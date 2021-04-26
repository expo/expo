/**
 * Scopes you can request when calling `AppleAuthentication.signInAsync()` or
 * `AppleAuthentication.refreshAsync()`.
 *
 * @note Note that it is possible that you will not be granted all of the scopes which you request.
 * You will still need to handle null values for any fields you request.
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
/**
 * The state of the credential when checked with `AppleAuthentication.getCredentialStateAsync()`.
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
/**
 * A value that indicates whether the user appears to be a real person. You get this in the
 * realUserStatus property of a `Credential` object. It can be used as one metric to help prevent
 * fraud.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asuserdetectionstatus)
 * for more details.
 */
export var AppleAuthenticationUserDetectionStatus;
(function (AppleAuthenticationUserDetectionStatus) {
    AppleAuthenticationUserDetectionStatus[AppleAuthenticationUserDetectionStatus["UNSUPPORTED"] = 0] = "UNSUPPORTED";
    AppleAuthenticationUserDetectionStatus[AppleAuthenticationUserDetectionStatus["UNKNOWN"] = 1] = "UNKNOWN";
    AppleAuthenticationUserDetectionStatus[AppleAuthenticationUserDetectionStatus["LIKELY_REAL"] = 2] = "LIKELY_REAL";
})(AppleAuthenticationUserDetectionStatus || (AppleAuthenticationUserDetectionStatus = {}));
/**
 * Controls the predefined text shown on the authentication button.
 */
export var AppleAuthenticationButtonType;
(function (AppleAuthenticationButtonType) {
    AppleAuthenticationButtonType[AppleAuthenticationButtonType["SIGN_IN"] = 0] = "SIGN_IN";
    AppleAuthenticationButtonType[AppleAuthenticationButtonType["CONTINUE"] = 1] = "CONTINUE";
    /**
     * Requires iOS 13.2 or later.
     */
    AppleAuthenticationButtonType[AppleAuthenticationButtonType["SIGN_UP"] = 2] = "SIGN_UP";
})(AppleAuthenticationButtonType || (AppleAuthenticationButtonType = {}));
/**
 * Controls the predefined style of the authenticating button.
 */
export var AppleAuthenticationButtonStyle;
(function (AppleAuthenticationButtonStyle) {
    AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle["WHITE"] = 0] = "WHITE";
    AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle["WHITE_OUTLINE"] = 1] = "WHITE_OUTLINE";
    AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle["BLACK"] = 2] = "BLACK";
})(AppleAuthenticationButtonStyle || (AppleAuthenticationButtonStyle = {}));
//# sourceMappingURL=AppleAuthentication.types.js.map
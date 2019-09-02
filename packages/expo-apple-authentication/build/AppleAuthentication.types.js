/**
 * Controls which scopes you are requesting when the call `AppleAuthentication.requestAsync()`.
 *
 * @note Note that it is possible that you will not be granted all of the scopes which you request.
 * You need to check which ones you are granted in the `Credential` you get back.
 *
 * @see [Apple documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationscope) for more details.
 */
export var AppleAuthenticationScope;
(function (AppleAuthenticationScope) {
    /**
     * A scope that includes the user’s full name.
     */
    AppleAuthenticationScope[AppleAuthenticationScope["FULL_NAME"] = 0] = "FULL_NAME";
    /**
     * A scope that includes the user’s email address.
     */
    AppleAuthenticationScope[AppleAuthenticationScope["EMAIL"] = 1] = "EMAIL";
})(AppleAuthenticationScope || (AppleAuthenticationScope = {}));
/**
 * Controls what operation you are requesting when the call `AppleAuthentication.requestAsync()`.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidoperation) for more details.
 */
export var AppleAuthenticationOperation;
(function (AppleAuthenticationOperation) {
    /**
     * An operation that depends on the particular kind of credential provider.
     */
    AppleAuthenticationOperation[AppleAuthenticationOperation["IMPLICIT"] = 0] = "IMPLICIT";
    /**
     * An operation used to authenticate a user.
     */
    AppleAuthenticationOperation[AppleAuthenticationOperation["LOGIN"] = 1] = "LOGIN";
    /**
     * An operation that refreshes the logged-in user’s credentials.
     */
    AppleAuthenticationOperation[AppleAuthenticationOperation["REFRESH"] = 2] = "REFRESH";
    /**
     * An operation that ends an authenticated session.
     */
    AppleAuthenticationOperation[AppleAuthenticationOperation["LOGOUT"] = 3] = "LOGOUT";
})(AppleAuthenticationOperation || (AppleAuthenticationOperation = {}));
/**
 * Defines the state that the credential is in when responding to your call to `AppleAuthentication.getCredentialStateAsync()`.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovidercredentialstate) for more details.
 */
export var AppleAuthenticationCredentialState;
(function (AppleAuthenticationCredentialState) {
    /**
     * Authorization for the given user has been revoked.
     */
    AppleAuthenticationCredentialState[AppleAuthenticationCredentialState["REVOKED"] = 0] = "REVOKED";
    /**
     * The user is authorized.
     */
    AppleAuthenticationCredentialState[AppleAuthenticationCredentialState["AUTHORIZED"] = 1] = "AUTHORIZED";
    /**
     * The user can’t be found.
     */
    AppleAuthenticationCredentialState[AppleAuthenticationCredentialState["NOT_FOUND"] = 2] = "NOT_FOUND";
    /**
     * Undocumented by Apple yet.
     */
    AppleAuthenticationCredentialState[AppleAuthenticationCredentialState["TRANSFERRED"] = 3] = "TRANSFERRED";
})(AppleAuthenticationCredentialState || (AppleAuthenticationCredentialState = {}));
/**
 * A value that indicates whether the user appears to be a real person.
 * You get this in the realUserStatus property of a `Credential` object.
 * It can be used as one metric to help prevent fraud.
 *
 * @see [Apple documentation](https://developer.apple.com/documentation/authenticationservices/asuserdetectionstatus) for more details.
 */
export var AppleAuthenticationUserDetectionStatus;
(function (AppleAuthenticationUserDetectionStatus) {
    /**
     * User detection not supported on current platform.
     */
    AppleAuthenticationUserDetectionStatus[AppleAuthenticationUserDetectionStatus["UNSUPPORTED"] = 0] = "UNSUPPORTED";
    /**
     * We could not determine the value. New users in the ecosystem will get this value as well, so you should not blacklist but instead treat these users as any new user through standard email sign up flows.
     */
    AppleAuthenticationUserDetectionStatus[AppleAuthenticationUserDetectionStatus["UNKNOWN"] = 1] = "UNKNOWN";
    /**
     * A hint that we have high confidence that the user is real.
     */
    AppleAuthenticationUserDetectionStatus[AppleAuthenticationUserDetectionStatus["LIKELY_REAL"] = 2] = "LIKELY_REAL";
})(AppleAuthenticationUserDetectionStatus || (AppleAuthenticationUserDetectionStatus = {}));
/**
 * Controls the text that is shown on the authenticating button.
 */
export var AppleAuthenticationButtonType;
(function (AppleAuthenticationButtonType) {
    AppleAuthenticationButtonType[AppleAuthenticationButtonType["SIGN_IN"] = 0] = "SIGN_IN";
    AppleAuthenticationButtonType[AppleAuthenticationButtonType["CONTINUE"] = 1] = "CONTINUE";
    AppleAuthenticationButtonType[AppleAuthenticationButtonType["DEFAULT"] = 2] = "DEFAULT";
})(AppleAuthenticationButtonType || (AppleAuthenticationButtonType = {}));
/**
 * Controls the style of the authenticating button.
 */
export var AppleAuthenticationButtonStyle;
(function (AppleAuthenticationButtonStyle) {
    AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle["WHITE"] = 0] = "WHITE";
    AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle["WHITE_OUTLINE"] = 1] = "WHITE_OUTLINE";
    AppleAuthenticationButtonStyle[AppleAuthenticationButtonStyle["BLACK"] = 2] = "BLACK";
})(AppleAuthenticationButtonStyle || (AppleAuthenticationButtonStyle = {}));
/**
 * Indicates the status of the attempt to retrieve the requested credential.
 */
export var AppleAuthenticationStatus;
(function (AppleAuthenticationStatus) {
    AppleAuthenticationStatus["SUCCESS"] = "success";
    AppleAuthenticationStatus["REVOKE"] = "revoke";
    AppleAuthenticationStatus["CANCEL"] = "cancel";
})(AppleAuthenticationStatus || (AppleAuthenticationStatus = {}));
//# sourceMappingURL=AppleAuthentication.types.js.map
/**
 * Controls which scopes you are requesting when the call `AppleAuthentication.requestAsync()`.
 *
 * @note Note that it is possible that you will not be granted all of the scopes which you request.
 * You need to check which ones you are granted in the `Credential` you get back.
 *
 * @see [Apple documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationscope) for more details.
 */
export var Scope;
(function (Scope) {
    /**
     * A scope that includes the user’s full name.
     */
    Scope[Scope["FullName"] = 0] = "FullName";
    /**
     * A scope that includes the user’s email address.
     */
    Scope[Scope["Email"] = 1] = "Email";
})(Scope || (Scope = {}));
/**
 * Controls what operation you are requesting when the call `AppleAuthentication.requestAsync()`.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidoperation) for more details.
 */
export var Operation;
(function (Operation) {
    /**
     * An operation that depends on the particular kind of credential provider.
     */
    Operation[Operation["Implicit"] = 0] = "Implicit";
    /**
     * An operation used to authenticate a user.
     */
    Operation[Operation["Login"] = 1] = "Login";
    /**
     * An operation that refreshes the logged-in user’s credentials.
     */
    Operation[Operation["Refresh"] = 2] = "Refresh";
    /**
     * An operation that ends an authenticated session.
     */
    Operation[Operation["Logout"] = 3] = "Logout";
})(Operation || (Operation = {}));
/**
 * Defines the state that the credential is in when responding to your call to `AppleAuthentication.getCredentialStateAsync()`.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovidercredentialstate) for more details.
 */
export var CredentialState;
(function (CredentialState) {
    /**
     * Authorization for the given user has been revoked.
     */
    CredentialState[CredentialState["Revoked"] = 0] = "Revoked";
    /**
     * The user is authorized.
     */
    CredentialState[CredentialState["Authorized"] = 1] = "Authorized";
    /**
     * The user can’t be found.
     */
    CredentialState[CredentialState["NotFound"] = 2] = "NotFound";
    /**
     * Undocumented by Apple yet.
     */
    CredentialState[CredentialState["Transferred"] = 3] = "Transferred";
})(CredentialState || (CredentialState = {}));
/**
 * A value that indicates whether the user appears to be a real person.
 * You get this in the realUserStatus property of a `Credential` object.
 * It can be used as one metric to help prevent fraud.
 *
 * @see [Apple documentation](https://developer.apple.com/documentation/authenticationservices/asuserdetectionstatus) for more details.
 */
export var UserDetectionStatus;
(function (UserDetectionStatus) {
    /**
     * User detection not supported on current platform.
     */
    UserDetectionStatus[UserDetectionStatus["Unsupported"] = 0] = "Unsupported";
    /**
     * We could not determine the value. New users in the ecosystem will get this value as well, so you should not blacklist but instead treat these users as any new user through standard email sign up flows.
     */
    UserDetectionStatus[UserDetectionStatus["Unknown"] = 1] = "Unknown";
    /**
     * A hint that we have high confidence that the user is real.
     */
    UserDetectionStatus[UserDetectionStatus["LikelyReal"] = 2] = "LikelyReal";
})(UserDetectionStatus || (UserDetectionStatus = {}));
/**
 * Controls the text that is shown on the authenticating button.
 */
export var ButtonType;
(function (ButtonType) {
    ButtonType[ButtonType["SignIn"] = 0] = "SignIn";
    ButtonType[ButtonType["Continue"] = 1] = "Continue";
    ButtonType[ButtonType["Default"] = 2] = "Default";
})(ButtonType || (ButtonType = {}));
/**
 * Controls the style of the authenticating button.
 */
export var ButtonStyle;
(function (ButtonStyle) {
    ButtonStyle[ButtonStyle["White"] = 0] = "White";
    ButtonStyle[ButtonStyle["WhiteOutline"] = 1] = "WhiteOutline";
    ButtonStyle[ButtonStyle["Black"] = 2] = "Black";
})(ButtonStyle || (ButtonStyle = {}));
/**
 * Indicates the status of the attempt to retrieve the requested credential.
 */
export var Status;
(function (Status) {
    Status["Success"] = "success";
    Status["Revoke"] = "revoke";
    Status["Cancel"] = "cancel";
})(Status || (Status = {}));
//# sourceMappingURL=AppleAuthentication.types.js.map
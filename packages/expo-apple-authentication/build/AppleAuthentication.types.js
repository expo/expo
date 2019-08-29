import ExpoAppleAuthentication from './ExpoAppleAuthentication';
const { Scope, Operation, CredentialState, UserDetectionStatus, ButtonType, ButtonStyle, } = ExpoAppleAuthentication;
/**
 * Controls which scopes you are requesting when the call `SignInWithApple.requestAsync()`.
 *
 * @note Note that it is possible that you will not be granted all of the scopes which you request.
 * You need to check which ones you are granted in the `SignInWithAppleCredential` you get back.
 *
 * @see [Apple documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationscope) for more details.
 */
export var SignInWithAppleScope;
(function (SignInWithAppleScope) {
    /**
     * A scope that includes the user’s full name.
     */
    SignInWithAppleScope[SignInWithAppleScope["FullName"] = Scope && Scope.FullName] = "FullName";
    /**
     * A scope that includes the user’s email address.
     */
    SignInWithAppleScope[SignInWithAppleScope["Email"] = Scope && Scope.Email] = "Email";
})(SignInWithAppleScope || (SignInWithAppleScope = {}));
/**
 * Controls what operation you are requesting when the call `SignInWithApple.requestAsync()`.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidoperation) for more details.
 */
export var SignInWithAppleOperation;
(function (SignInWithAppleOperation) {
    /**
     * An operation used to authenticate a user.
     */
    SignInWithAppleOperation[SignInWithAppleOperation["Login"] = Operation && Operation.Login] = "Login";
    /**
     * An operation that ends an authenticated session.
     */
    SignInWithAppleOperation[SignInWithAppleOperation["Logout"] = Operation && Operation.Logout] = "Logout";
    /**
     * An operation that refreshes the logged-in user’s credentials.
     */
    SignInWithAppleOperation[SignInWithAppleOperation["Refresh"] = Operation && Operation.Refresh] = "Refresh";
    /**
     * An operation that depends on the particular kind of credential provider.
     */
    SignInWithAppleOperation[SignInWithAppleOperation["Implicit"] = Operation && Operation.Implicit] = "Implicit";
})(SignInWithAppleOperation || (SignInWithAppleOperation = {}));
/**
 * Defines the state that the credential is in when responding to your call to `SignInWithApple.getCredentialStateAsync()`.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovidercredentialstate) for more details.
 */
export var SignInWithAppleCredentialState;
(function (SignInWithAppleCredentialState) {
    /**
     * The user is authorized.
     */
    SignInWithAppleCredentialState[SignInWithAppleCredentialState["Authorized"] = CredentialState && CredentialState.Authorized] = "Authorized";
    /**
     * Authorization for the given user has been revoked.
     */
    SignInWithAppleCredentialState[SignInWithAppleCredentialState["Revoked"] = CredentialState && CredentialState.Revoked] = "Revoked";
    /**
     * The user can’t be found.
     */
    SignInWithAppleCredentialState[SignInWithAppleCredentialState["NotFound"] = CredentialState && CredentialState.NotFound] = "NotFound";
})(SignInWithAppleCredentialState || (SignInWithAppleCredentialState = {}));
/**
 * A value that indicates whether the user appears to be a real person.
 * You get this in the realUserStatus property of a SignInWithAppleCredential object.
 * It can be used as one metric to help prevent fraud.
 *
 * @see [Apple documentation](https://developer.apple.com/documentation/authenticationservices/asuserdetectionstatus) for more details.
 */
export var SignInWithAppleUserDetectionStatus;
(function (SignInWithAppleUserDetectionStatus) {
    /**
     * The user appears to be a real person.
     */
    SignInWithAppleUserDetectionStatus[SignInWithAppleUserDetectionStatus["LikelyReal"] = UserDetectionStatus && UserDetectionStatus.LikelyReal] = "LikelyReal";
    /**
     * The system hasn’t determined whether the user might be a real person.
     */
    SignInWithAppleUserDetectionStatus[SignInWithAppleUserDetectionStatus["Unknown"] = UserDetectionStatus && UserDetectionStatus.Unknown] = "Unknown";
    /**
     * The system can’t determine this user’s status as a real person.
     */
    SignInWithAppleUserDetectionStatus[SignInWithAppleUserDetectionStatus["Unsupported"] = UserDetectionStatus && UserDetectionStatus.Unsupported] = "Unsupported";
})(SignInWithAppleUserDetectionStatus || (SignInWithAppleUserDetectionStatus = {}));
/**
 * Controls the text that is shown of the `SignInWithAppleButton`.
 */
export var SignInWithAppleButtonType;
(function (SignInWithAppleButtonType) {
    SignInWithAppleButtonType[SignInWithAppleButtonType["Default"] = ButtonType && ButtonType.Default] = "Default";
    SignInWithAppleButtonType[SignInWithAppleButtonType["SignIn"] = ButtonType && ButtonType.SignIn] = "SignIn";
    SignInWithAppleButtonType[SignInWithAppleButtonType["Continue"] = ButtonType && ButtonType.Continue] = "Continue";
})(SignInWithAppleButtonType || (SignInWithAppleButtonType = {}));
/**
 * Controls the style of the `SignInWithAppleButton`.
 */
export var SignInWithAppleButtonStyle;
(function (SignInWithAppleButtonStyle) {
    SignInWithAppleButtonStyle[SignInWithAppleButtonStyle["Black"] = ButtonStyle && ButtonStyle.Black] = "Black";
    SignInWithAppleButtonStyle[SignInWithAppleButtonStyle["White"] = ButtonStyle && ButtonStyle.White] = "White";
    SignInWithAppleButtonStyle[SignInWithAppleButtonStyle["WhiteOutline"] = ButtonStyle && ButtonStyle.WhiteOutline] = "WhiteOutline";
})(SignInWithAppleButtonStyle || (SignInWithAppleButtonStyle = {}));
//# sourceMappingURL=AppleAuthentication.types.js.map
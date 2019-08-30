import { StyleProp, ViewStyle } from 'react-native';
export interface ButtonProps {
    /**
     * The callback which is called when the user pressed the button.
     */
    onPress: () => void;
    /**
     * Controls the text that is shown on the button.
     */
    buttonType: ButtonType;
    /**
     * Controls the style of the button.
     */
    buttonStyle: ButtonStyle;
    /**
     * The radius of the corners of the button.
     */
    cornerRadius?: number;
    style?: StyleProp<ViewStyle>;
}
/**
* The options you can supply when making a call to `AppleAuthentication.requestAsync()`.
*
* @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest) for more details.
*/
export interface RequestOptions {
    /**
      * The scopes that you are requesting.
      * @defaults `[]` (no scopes).
      */
    requestedScopes?: Scope[];
    /**
      * The operation that you would like to perform.
      * @defaults `AppleAuthentication.Operation.Implicit`
      */
    requestedOperation?: Operation;
    /**
      * Must be set for `Refresh` and `Logout` operations
      *
      * Typically you leave this property set to nil the first time you authenticate a user.
      * Otherwise, if you previously received an `Credential` set this property to the value from the user property.
      * Must be set for Refresh and Logout operations.
    */
    user?: string;
    /**
      * Data that’s returned to you unmodified in the corresponding credential after a successful authentication.
      * Used to verify that the response was from the request you made.
      * Can be used to avoid replay attacks.
      */
    state?: string;
}
/**
* The user credentials returned to a successful call to `AppleAuthentication.requestAsync()`.
*
* @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidcredential) for more details.
*/
export interface Credential {
    /**
     * A value indicating the status type of the requested credential.
     * Success if the credential was retrieved successfully,
     * Revoke if the credential was revoked,
     * or Cancel if the user canceled the Sign In operation.
     */
    type: Status;
    /**
      * A JSON Web Token (JWT) that securely communicates information about the user to your app.
      */
    identityToken?: string;
    /**
      * 	A short-lived token used by your app for proof of authorization when interacting with the app’s server counterpart.
      */
    authorizationCode?: string;
    /**
      * An arbitrary string that your app provided to the request that generated the credential.
      * You can set this in `RequestOptions`.
      */
    user?: string;
    /**
      * An identifier associated with the authenticated user.
      * You can use this to check if the user is still authenticated later.
      * This is stable and can be shared across apps released under the same development team.
      * The same user will have a different identifier for apps released by other developers.
      */
    state?: string;
    /**
      * The contact information the user authorized your app to access.
      */
    authorizedScopes?: Scope[];
    /**
      * The user’s name. Might not present if you didn't request access or if the user denied access.
      */
    fullName?: string;
    /**
      * The user’s email address. Might not present if you didn't request access or if the user denied access.
      */
    email?: string;
    /**
      * A value that indicates whether the user appears to be a real person.
      */
    realUserStatus?: UserDetectionStatus;
}
/**
 * Tokenized object representing the different portions of the user's full name.
 */
export interface FullName {
    namePrefix?: string;
    givenName?: string;
    middleName?: string;
    familyName?: string;
    nameSuffix?: string;
    nickname?: string;
}
/**
 * Controls which scopes you are requesting when the call `AppleAuthentication.requestAsync()`.
 *
 * @note Note that it is possible that you will not be granted all of the scopes which you request.
 * You need to check which ones you are granted in the `Credential` you get back.
 *
 * @see [Apple documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationscope) for more details.
 */
export declare enum Scope {
    /**
     * A scope that includes the user’s full name.
     */
    FullName = 0,
    /**
     * A scope that includes the user’s email address.
     */
    Email = 1
}
/**
 * Controls what operation you are requesting when the call `AppleAuthentication.requestAsync()`.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidoperation) for more details.
 */
export declare enum Operation {
    /**
     * An operation that depends on the particular kind of credential provider.
     */
    Implicit = 0,
    /**
     * An operation used to authenticate a user.
     */
    Login = 1,
    /**
     * An operation that refreshes the logged-in user’s credentials.
     */
    Refresh = 2,
    /**
     * An operation that ends an authenticated session.
     */
    Logout = 3
}
/**
 * Defines the state that the credential is in when responding to your call to `AppleAuthentication.getCredentialStateAsync()`.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovidercredentialstate) for more details.
 */
export declare enum CredentialState {
    /**
     * Authorization for the given user has been revoked.
     */
    Revoked = 0,
    /**
     * The user is authorized.
     */
    Authorized = 1,
    /**
     * The user can’t be found.
     */
    NotFound = 2,
    /**
     * Undocumented by Apple yet.
     */
    Transferred = 3
}
/**
 * A value that indicates whether the user appears to be a real person.
 * You get this in the realUserStatus property of a `Credential` object.
 * It can be used as one metric to help prevent fraud.
 *
 * @see [Apple documentation](https://developer.apple.com/documentation/authenticationservices/asuserdetectionstatus) for more details.
 */
export declare enum UserDetectionStatus {
    /**
     * User detection not supported on current platform.
     */
    Unsupported = 0,
    /**
     * We could not determine the value. New users in the ecosystem will get this value as well, so you should not blacklist but instead treat these users as any new user through standard email sign up flows.
     */
    Unknown = 1,
    /**
     * A hint that we have high confidence that the user is real.
     */
    LikelyReal = 2
}
/**
 * Controls the text that is shown on the authenticating button.
 */
export declare enum ButtonType {
    SignIn = 0,
    Continue = 1,
    Default = 2
}
/**
 * Controls the style of the authenticating button.
 */
export declare enum ButtonStyle {
    White = 0,
    WhiteOutline = 1,
    Black = 2
}
/**
 * Indicates the status of the attempt to retrieve the requested credential.
 */
export declare enum Status {
    Success = "success",
    Revoke = "revoke",
    Cancel = "cancel"
}
/**
 * Event sent to the listener when the user's credentials have been revoked.
 */
export declare type RevokeEvent = {
    type: Status;
};
/**
 * Listener that is called when the user's credentials have been revoked.
 */
export declare type RevokeListener = (event: RevokeEvent) => void;

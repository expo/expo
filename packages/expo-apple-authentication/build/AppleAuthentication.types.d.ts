import { StyleProp, ViewStyle } from 'react-native';
export interface SignInWithAppleButtonProps {
    /**
     * The callback which is called when the user pressed the button.
     */
    onPress: () => void;
    /**
     * Controls the text that is shown on the button.
     */
    buttonType: SignInWithAppleButtonType;
    /**
     * Controls the style of the button.
     */
    buttonStyle: SignInWithAppleButtonStyle;
    /**
     * The radius of the corners of the button.
     */
    cornerRadius?: number;
    style?: StyleProp<ViewStyle>;
}
/**
* The options you can supply when making a call to `SignInWithApple.requestAsync()`.
*
* @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest) for more details.
*/
export interface SignInWithAppleOptions {
    /**
      * The scopes that you are requesting.
      * @defaults `[]` (no scopes).
      */
    requestedScopes?: SignInWithAppleScope[];
    /**
      * The operation that you would like to perform.
      * @defaults `SignInWithApple.Operation.Login`
      */
    requestedOperation?: SignInWithAppleOperation;
    /**
      * Must be set for `Refresh` and `Logout` operations
      *
      * Typically you leave this property set to nil the first time you authenticate a user.
      * Otherwise, if you previously received an `SignInWithAppleCredential` set this property to the value from the user property.
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
* The user credentials returned to a successful call to `SignInWithApple.requestAsync()`.
*
* @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidcredential) for more details.
*/
export interface SignInWithAppleCredential {
    /**
     * A value indicating the status type of the requested credential.
     * Success if the credential was retrieved successfully,
     * Revoke if the credential was revoked,
     * or Cancel if the user canceled the Sign In operation.
     */
    type: SignInWithAppleStatus;
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
      * You can set this in `SignInWithAppleOptions`.
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
    authorizedScopes?: SignInWithAppleScope[];
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
    realUserStatus?: SignInWithAppleUserDetectionStatus;
}
/**
 * Tokenized object representing the different portions of the user's full name.
 */
export interface SignInWithAppleFullName {
    namePrefix?: string;
    givenName?: string;
    middleName?: string;
    familyName?: string;
    nameSuffix?: string;
    nickname?: string;
}
/**
 * Controls which scopes you are requesting when the call `SignInWithApple.requestAsync()`.
 *
 * @note Note that it is possible that you will not be granted all of the scopes which you request.
 * You need to check which ones you are granted in the `SignInWithAppleCredential` you get back.
 *
 * @see [Apple documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationscope) for more details.
 */
export declare enum SignInWithAppleScope {
    /**
     * A scope that includes the user’s full name.
     */
    FullName,
    /**
     * A scope that includes the user’s email address.
     */
    Email
}
/**
 * Controls what operation you are requesting when the call `SignInWithApple.requestAsync()`.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidoperation) for more details.
 */
export declare enum SignInWithAppleOperation {
    /**
     * An operation used to authenticate a user.
     */
    Login,
    /**
     * An operation that ends an authenticated session.
     */
    Logout,
    /**
     * An operation that refreshes the logged-in user’s credentials.
     */
    Refresh,
    /**
     * An operation that depends on the particular kind of credential provider.
     */
    Implicit
}
/**
 * Defines the state that the credential is in when responding to your call to `SignInWithApple.getCredentialStateAsync()`.
 *
 * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovidercredentialstate) for more details.
 */
export declare enum SignInWithAppleCredentialState {
    /**
     * The user is authorized.
     */
    Authorized,
    /**
     * Authorization for the given user has been revoked.
     */
    Revoked,
    /**
     * The user can’t be found.
     */
    NotFound
}
/**
 * A value that indicates whether the user appears to be a real person.
 * You get this in the realUserStatus property of a SignInWithAppleCredential object.
 * It can be used as one metric to help prevent fraud.
 *
 * @see [Apple documentation](https://developer.apple.com/documentation/authenticationservices/asuserdetectionstatus) for more details.
 */
export declare enum SignInWithAppleUserDetectionStatus {
    /**
     * The user appears to be a real person.
     */
    LikelyReal,
    /**
     * The system hasn’t determined whether the user might be a real person.
     */
    Unknown,
    /**
     * The system can’t determine this user’s status as a real person.
     */
    Unsupported
}
/**
 * Controls the text that is shown of the `SignInWithAppleButton`.
 */
export declare enum SignInWithAppleButtonType {
    Default,
    SignIn,
    Continue
}
/**
 * Controls the style of the `SignInWithAppleButton`.
 */
export declare enum SignInWithAppleButtonStyle {
    Black,
    White,
    WhiteOutline
}
/**
 * Indicates the status of the attempt to retrieve the requested credential.
 */
export declare enum SignInWithAppleStatus {
    Success = "success",
    Revoke = "revoke",
    Cancel = "cancel"
}
/**
 * Event sent to the listener when the user's credentials have been revoked.
 */
export declare type RevokeEvent = {
    type: SignInWithAppleStatus;
};
/**
 * Listener that is called when the user's credentials have been revoked.
 */
export declare type RevokeListener = (event: RevokeEvent) => void;

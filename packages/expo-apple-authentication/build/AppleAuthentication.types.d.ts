import { StyleProp, ViewStyle } from 'react-native';
export declare type AppleAuthenticationButtonProps = {
    onPress: () => void;
    buttonType: AppleAuthenticationButtonType;
    buttonStyle: AppleAuthenticationButtonStyle;
    cornerRadius?: number;
    style?: StyleProp<ViewStyle>;
};
/**
 * The options you can supply when making a call to `AppleAuthentication.signInAsync()`. None of
 * these options are required.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest)
 * for more details.
 */
export declare type AppleAuthenticationSignInOptions = {
    /**
     * The scope of personal information to which your app is requesting access. The user can choose
     * to deny your app access to any scope at the time of logging in.
     * @defaults `[]` (no scopes).
     */
    requestedScopes?: AppleAuthenticationScope[];
    /**
     * Data that's returned to you unmodified in the corresponding credential after a successful
     * authentication. Used to verify that the response was from the request you made. Can be used to
     * avoid replay attacks.
     */
    state?: string;
    /**
     * Data that is used to verify the uniqueness of a response and prevent replay attacks.
     */
    nonce?: string;
};
/**
 * The options you can supply when making a call to `AppleAuthentication.refreshAsync()`. You must
 * include the ID string of the user whose credentials you'd like to refresh.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest)
 * for more details.
 */
export declare type AppleAuthenticationRefreshOptions = {
    user: string;
    /**
     * The scope of personal information to which your app is requesting access. The user can choose
     * to deny your app access to any scope at the time of refreshing.
     * @defaults `[]` (no scopes).
     */
    requestedScopes?: AppleAuthenticationScope[];
    /**
     * Data that's returned to you unmodified in the corresponding credential after a successful
     * authentication. Used to verify that the response was from the request you made. Can be used to
     * avoid replay attacks.
     */
    state?: string;
};
/**
 * The options you can supply when making a call to `AppleAuthentication.signOutAsync()`. You must
 * include the ID string of the user to sign out.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest)
 * for more details.
 */
export declare type AppleAuthenticationSignOutOptions = {
    user: string;
    /**
     * Data that's returned to you unmodified in the corresponding credential after a successful
     * authentication. Used to verify that the response was from the request you made. Can be used to
     * avoid replay attacks.
     */
    state?: string;
};
/**
 * The user credentials returned from a successful call to `AppleAuthentication.signInAsync()`,
 * `AppleAuthentication.refreshAsync()`, or `AppleAuthentication.signOutAsync()`.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidcredential)
 * for more details.
 */
export declare type AppleAuthenticationCredential = {
    /**
     * An identifier associated with the authenticated user. You can use this to check if the user is
     * still authenticated later. This is stable and can be shared across apps released under the same
     * development team. The same user will have a different identifier for apps released by other
     * developers.
     */
    user: string;
    /**
     * An arbitrary string that your app provided as `state` in the request that generated the
     * credential. Used to verify that the response was from the request you made. Can be used to
     * avoid replay attacks.
     */
    state: string | null;
    /**
     * The user's name. May be `null` or contain `null` values if you didn't request the `FULL_NAME`
     * scope, if the user denied access, or if this is not the first time the user has signed into
     * your app.
     */
    fullName: AppleAuthenticationFullName | null;
    /**
     * The user's email address. Might not be present if you didn't request the `EMAIL` scope. May
     * also be null if this is not the first time the user has signed into your app. If the user chose
     * to withhold their email address, this field will instead contain an obscured email address with
     * an Apple domain.
     */
    email: string | null;
    /**
     * A value that indicates whether the user appears to the system to be a real person.
     */
    realUserStatus: AppleAuthenticationUserDetectionStatus;
    /**
     * A JSON Web Token (JWT) that securely communicates information about the user to your app.
     */
    identityToken: string | null;
    /**
     * A short-lived session token used by your app for proof of authorization when interacting with
     * the app's server counterpart. Unlike `user`, this is ephemeral and will change each session.
     */
    authorizationCode: string | null;
};
/**
 * An object representing the tokenized portions of the user's full name.
 */
export declare type AppleAuthenticationFullName = {
    namePrefix: string | null;
    givenName: string | null;
    middleName: string | null;
    familyName: string | null;
    nameSuffix: string | null;
    nickname: string | null;
};
export declare type AppleAuthenticationRevokeListener = () => void;
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
export declare enum AppleAuthenticationScope {
    FULL_NAME = 0,
    EMAIL = 1
}
export declare enum AppleAuthenticationOperation {
    /**
     * An operation that depends on the particular kind of credential provider.
     */
    IMPLICIT = 0,
    LOGIN = 1,
    REFRESH = 2,
    LOGOUT = 3
}
/**
 * The state of the credential when checked with `AppleAuthentication.getCredentialStateAsync()`.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovidercredentialstate)
 * for more details.
 */
export declare enum AppleAuthenticationCredentialState {
    REVOKED = 0,
    AUTHORIZED = 1,
    NOT_FOUND = 2,
    TRANSFERRED = 3
}
/**
 * A value that indicates whether the user appears to be a real person. You get this in the
 * realUserStatus property of a `Credential` object. It can be used as one metric to help prevent
 * fraud.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asuserdetectionstatus)
 * for more details.
 */
export declare enum AppleAuthenticationUserDetectionStatus {
    UNSUPPORTED = 0,
    UNKNOWN = 1,
    LIKELY_REAL = 2
}
/**
 * Controls the predefined text shown on the authentication button.
 */
export declare enum AppleAuthenticationButtonType {
    SIGN_IN = 0,
    CONTINUE = 1,
    /**
     * Requires iOS 13.2 or later.
     */
    SIGN_UP = 2
}
/**
 * Controls the predefined style of the authenticating button.
 */
export declare enum AppleAuthenticationButtonStyle {
    WHITE = 0,
    WHITE_OUTLINE = 1,
    BLACK = 2
}

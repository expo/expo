import type { StyleProp, ViewStyle, ViewProps } from 'react-native';
export declare type AppleAuthenticationButtonProps = ViewProps & {
    /**
     * The method to call when the user presses the button. You should call [`AppleAuthentication.signInAsync`](#appleauthenticationisavailableasync)
     * in here.
     */
    onPress: () => void;
    /**
     * The type of button text to display ("Sign In with Apple" vs. "Continue with Apple").
     */
    buttonType: AppleAuthenticationButtonType;
    /**
     * The Apple-defined color scheme to use to display the button.
     */
    buttonStyle: AppleAuthenticationButtonStyle;
    /**
     * The border radius to use when rendering the button. This works similarly to
     * `style.borderRadius` in other Views.
     */
    cornerRadius?: number;
    /**
     * The custom style to apply to the button. Should not include `backgroundColor` or `borderRadius`
     * properties.
     */
    style?: StyleProp<Omit<ViewStyle, 'backgroundColor' | 'borderRadius'>>;
};
/**
 * The options you can supply when making a call to [`AppleAuthentication.signInAsync()`](#appleauthenticationsigninasyncoptions).
 * None of these options are required.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest)
 * for more details.
 */
export type AppleAuthenticationSignInOptions = {
    /**
     * Array of user information scopes to which your app is requesting access. Note that the user can
     * choose to deny your app access to any scope at the time of logging in. You will still need to
     * handle `null` values for any scopes you request. Additionally, note that the requested scopes
     * will only be provided to you the first time each user signs into your app; in subsequent
     * requests they will be `null`. Defaults to `[]` (no scopes).
     */
    requestedScopes?: AppleAuthenticationScope[];
    /**
     * An arbitrary string that is returned unmodified in the corresponding credential after a
     * successful authentication. This can be used to verify that the response was from the request
     * you made and avoid replay attacks. More information on this property is available in the
     * OAuth 2.0 protocol [RFC6749](https://tools.ietf.org/html/rfc6749#section-10.12).
     */
    state?: string;
    /**
     * An arbitrary string that is used to prevent replay attacks. See more information on this in the
     * [OpenID Connect specification](https://openid.net/specs/openid-connect-core-1_0.html#CodeFlowSteps).
     */
    nonce?: string;
};
/**
 * The options you can supply when making a call to [`AppleAuthentication.refreshAsync()`](#appleauthenticationrefreshasyncoptions).
 * You must include the ID string of the user whose credentials you'd like to refresh.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest)
 * for more details.
 */
export type AppleAuthenticationRefreshOptions = {
    user: string;
    /**
     * Array of user information scopes to which your app is requesting access. Note that the user can
     * choose to deny your app access to any scope at the time of logging in. You will still need to
     * handle `null` values for any scopes you request. Additionally, note that the requested scopes
     * will only be provided to you the first time each user signs into your app; in subsequent
     * requests they will be `null`. Defaults to `[]` (no scopes).
     */
    requestedScopes?: AppleAuthenticationScope[];
    /**
     * An arbitrary string that is returned unmodified in the corresponding credential after a
     * successful authentication. This can be used to verify that the response was from the request
     * you made and avoid replay attacks. More information on this property is available in the
     * OAuth 2.0 protocol [RFC6749](https://tools.ietf.org/html/rfc6749#section-10.12).
     */
    state?: string;
};
/**
 * The options you can supply when making a call to [`AppleAuthentication.signOutAsync()`](#appleauthenticationsignoutasyncoptions).
 * You must include the ID string of the user to sign out.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest)
 * for more details.
 */
export type AppleAuthenticationSignOutOptions = {
    user: string;
    /**
     * An arbitrary string that is returned unmodified in the corresponding credential after a
     * successful authentication. This can be used to verify that the response was from the request
     * you made and avoid replay attacks. More information on this property is available in the
     * OAuth 2.0 protocol [RFC6749](https://tools.ietf.org/html/rfc6749#section-10.12).
     */
    state?: string;
};
/**
 * The object type returned from a successful call to [`AppleAuthentication.signInAsync()`](#appleauthenticationsigninasyncoptions),
 * [`AppleAuthentication.refreshAsync()`](#appleauthenticationrefreshasyncoptions), or [`AppleAuthentication.signOutAsync()`](#appleauthenticationsignoutasyncoptions)
 * which contains all of the pertinent user and credential information.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidcredential)
 * for more details.
 */
export type AppleAuthenticationCredential = {
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
     * avoid replay attacks. If you did not provide `state` when making the sign-in request, this field
     * will be `null`.
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
 * An object representing the tokenized portions of the user's full name. Any of all of the fields
 * may be `null`. Only applicable fields that the user has allowed your app to access will be nonnull.
 */
export type AppleAuthenticationFullName = {
    namePrefix: string | null;
    givenName: string | null;
    middleName: string | null;
    familyName: string | null;
    nameSuffix: string | null;
    nickname: string | null;
};
/**
 * An enum whose values specify the style for formatting a full name when calling `AppleAuthentication.formatFullName()`.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/foundation/personnamecomponentsformatter)
 * for more details.
 */
export type AppleAuthenticationFullNameFormatStyle = 'default' | 'short' | 'medium' | 'long' | 'abbreviated';
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
 * An enum whose values specify state of the credential when checked with [`AppleAuthentication.getCredentialStateAsync()`](#appleauthenticationgetcredentialstateasyncuser).
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
 * An enum whose values specify the system's best guess for how likely the current user is a real person.
 *
 * @see [Apple
 * Documentation](https://developer.apple.com/documentation/authenticationservices/asuserdetectionstatus)
 * for more details.
 */
export declare enum AppleAuthenticationUserDetectionStatus {
    /**
     * The system does not support this determination and there is no data.
     */
    UNSUPPORTED = 0,
    /**
     * The system has not determined whether the user might be a real person.
     */
    UNKNOWN = 1,
    /**
     * The user appears to be a real person.
     */
    LIKELY_REAL = 2
}
/**
 * An enum whose values control which pre-defined text to use when rendering an [`AppleAuthenticationButton`](#appleauthenticationbutton).
 */
export declare enum AppleAuthenticationButtonType {
    /**
     * "Sign in with Apple"
     */
    SIGN_IN = 0,
    /**
     * "Continue with Apple"
     */
    CONTINUE = 1,
    /**
     * "Sign up with Apple"
     * @platform ios 13.2+
     */
    SIGN_UP = 2
}
/**
 * An enum whose values control which pre-defined color scheme to use when rendering an [`AppleAuthenticationButton`](#appleauthenticationbutton).
 */
export declare enum AppleAuthenticationButtonStyle {
    /**
     * White button with black text.
     */
    WHITE = 0,
    /**
     * White button with a black outline and black text.
     */
    WHITE_OUTLINE = 1,
    /**
     * Black button with white text.
     */
    BLACK = 2
}
//# sourceMappingURL=AppleAuthentication.types.d.ts.map
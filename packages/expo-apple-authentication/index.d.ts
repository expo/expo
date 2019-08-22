import { NativeMethodsMixin } from 'react-native';
import { Component } from 'react';

interface SignInWithAppleButtonProps {
  /**
   * The callback which is called when the user pressed the button.
   */
  onPress: () => void;

  /**
   * Controls the text that is shown on the button.
   */
  type: SignInWithApple.ButtonType;

  /**
   * Controls the style of the button.
   */
  style: SignInWithApple.ButtonStyle;

  /**
   * The radius of the corners of the button.
   */
  cornerRadius?: number;
}

declare class SignInWithAppleButtonComponent extends Component<SignInWithAppleButtonProps> { }
type Constructor<T> = new (...args: any[]) => T;

/**
 * This component displays the "Sign In with Apple" button on your screen.
 * The App Store Guidelines require you to use this component to start the sign in process instead of a custom button.
 * You can customise the design of the button using the properties.
 * You should start the sign in process when the `onPress` property is called.
 *
 * You should only attempt to render this if `SignInWithApple.isAvailableAsync()` resolves to true.
 * This component will render nothing if it is not available and you will get a warning in `__DEV__ === true`.
 *
 * The properties of this component extends from View, however, you should not attempt to restyle the background color
 * or border radius with the style property.
 * This will not work and is against the App Store Guidelines.
 *
 * The additionally accepted properites are described in `SignInWithAppleButtonProps`.
 *
 * @see [Apple Documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidbutton) for more details.
 *
 * @example ```typescript
 * import { SignInWithAppleButton } from '@react-native-community/apple-authentication';
 *
 * function YourComponent() {
 *   return (
 *     <SignInWithAppleButton
 *       type={SignInWithAppleButton.Type.DEFAULT}
 *       style={SignInWithAppleButton.Type.BLACK}
 *       cornerRadus={5}
 *       onPress={() => {
 *         // Start the sign in process
 *       }}
 *     />
 *   );
 * }
 * ```
 */
export declare const SignInWithAppleButton: Constructor<NativeMethodsMixin> & typeof SignInWithAppleButtonComponent

export namespace SignInWithApple {
  /**
   * A method which returns a Promise which resolves to a boolean if you are able to perform a Sign In with Apple.
   * Generally users need to be on iOS 13+.
   */
  function isAvailableAsync(): Promise<boolean>;

  /**
   * Perform a Sign In with Apple request with the given SignInWithAppleOptions.
   * The method will return a Promise which will resolve to a SignInWithAppleCredential on success.
   * You should make sure you include error handling.
   *
   * @example ```typescript
   * import { SignInWithApple } from "@react-native-community/apple-authentication";
   *
   * SignInWithApple.requestAsync({
   *   requestedScopes: [
   *     SignInWithApple.Scope.FULL_NAME,
   *     SignInWithApple.Scope.EMAIL,
   *   ]
   * }).then(credentials => {
   *   // Handle successful authenticated
   * }).catch(error => {
   *   // Handle authentication errors
   * })
   * ```
   */
  function requestAsync(options: SignInWithAppleOptions): Promise<SignInWithAppleCredential>;

  /**
   * You can query the current state of a user ID.
   * It will tell you if the token is still valid or if it has been revoked by the user.
   *
   * @see [Apple Documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovider/3175423-getcredentialstateforuserid) for more details.
   *
   * @example ```typescript
   * import { SignInWithApple } from "@react-native-community/apple-authentication";
   *
   * SignInWithApple.getCredentialStateAsync(userId).then(state => {
   *   switch (state) {
   *     case SignInWithAppleCredential.CredentialState.AUTHORIZED:
   *       // Handle the authorised state
   *       break;
   *     case SignInWithAppleCredential.CredentialState.REVOKED:
   *       // The user has signed out
   *       break;
   *     case SignInWithAppleCredential.CredentialState.NOT_FOUND:
   *       // The user id was not found
   *       break;
   *   }
   * })
   * ```
   */
  function getCredentialStateAsync(userId: string): Promise<CredentialState>;

  /**
   * Adds a listener for when a token has been revoked.
   * This means that the user has signed out and you should update your UI to reflect this
   *
   * @example ```typescript
   * import { SignInWithApple } from "@react-native-community/apple-authentication";
   *
   * // Subscribe
   * const unsubscribe = SignInWithApple.addRevokeListener(() => {
   *   // Handle the token being revoked
   * })
   *
   * // Unsubscribe
   * unsubscribe();
   * ```
   */
  function addRevokeListener(revokeListener: () => void): () => void;

  /**
   * Controls which scopes you are requesting when the call `SignInWithApple.requestAsync()`.
   *
   * @note Note that it is possible that you will not be granted all of the scopes which you request.
   * You need to check which ones you are granted in the `SignInWithAppleCredential` you get back.
   *
   * @see [Apple documention](https://developer.apple.com/documentation/authenticationservices/asauthorizationscope) for more details.
   */
  enum Scope {
    /**
     * A scope that includes the user’s full name.
     */
    FULL_NAME,

    /**
     * A scope that includes the user’s email address.
     */
    EMAIL,
  }

  /**
   * Controls what operation you are requesting when the call `SignInWithApple.requestAsync()`.
   *
   * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidoperation) for more details.
   */
  enum Operation {
    /**
     * An operation used to authenticate a user.
     */
    LOGIN,

    /**
     * An operation that ends an authenticated session.
     */
    LOGOUT,

    /**
     * An operation that refreshes the logged-in user’s credentials.
     */
    REFRESH,

    /**
     * An operation that depends on the particular kind of credential provider.
     */
    IMPLICIT,
  }

  /**
   * Defines the state that the credential is in when responding to your call to `SignInWithApple.getCredentialStateAsync()`.
   *
   * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationappleidprovidercredentialstate) for more details.
   */
  enum CredentialState {
    /**
     * The user is authorized.
     */
    AUTHORIZED,

    /**
     * Authorization for the given user has been revoked.
     */
    REVOKED,

    /**
     * The user can’t be found.
     */
    NOT_FOUND,
  }

  /**
   * A value that indicates whether the user appears to be a real person.
   * You get this in the realUserStatus property of a SignInWithAppleCredential object.
   * It can be used as one metric to help prevent fraud.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/authenticationservices/asuserdetectionstatus) for more details.
   */
  enum UserDetectionStatus {
    /**
     * The user appears to be a real person.
     */
    LIKELY_REAL,

    /**
     * The system hasn’t determined whether the user might be a real person.
     */
    UNKNOWN,

    /**
     * The system can’t determine this user’s status as a real person.
     */
    UNSUPPORTED,
  }

  /**
   * Controls the text that is shown of the `SignInWithAppleButton`.
   */
  enum ButtonType {
    DEFAULT,
    SIGN_IN,
    CONTINUE,
  }

  /**
   * Controls the style of the `SignInWithAppleButton`.
   */
  enum ButtonStyle {
    BLACK,
    WHITE,
    WHTE_OUTLINE,
  }

  /**
   * The options you can supply when making a call to `SignInWithApple.requestAsync()`.
   *
   * @see [Apple Documentation](https://developer.apple.com/documentation/authenticationservices/asauthorizationopenidrequest) for more details.
   */
  interface SignInWithAppleOptions {
    /**
     * The scopes that you are requesting.
     * @defaults `[]` (no scopes).
     */
    requestedScopes?: SignInWithApple.Scope[] = [];

    /**
     * The operation that you would like to perform.
     * @defaults `SignInWithApple.Operation.Login`
     */
    requestedOperation?: SignInWithApple.Operation = SignInWithApple.Operation.Login;

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
  interface SignInWithAppleCredential {
    /**
     * A JSON Web Token (JWT) that securely communicates information about the user to your app.
     */
    identityToken: string;

    /**
     * 	A short-lived token used by your app for proof of authorization when interacting with the app’s server counterpart.
     */
    authorizationCode: string;

    /**
     * An arbitrary string that your app provided to the request that generated the credential.
     * You can set this in `SignInWithAppleOptions`.
     */
    user: string;

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
    authorizedScopes: SignInWithApple.Scope[];

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
    realUserStatus: SignInWithApple.UserDetectionStatus;
  }
}

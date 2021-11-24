import { OAuthBaseProps, OAuthProps, OAuthRevokeOptions, TokenResponse } from './AppAuth.types';
export * from './AppAuth.types';
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
export declare function getDefaultOAuthRedirect(): string;
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
export declare function authAsync(props: OAuthProps): Promise<TokenResponse>;
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
export declare function refreshAsync(props: OAuthProps, refreshToken: string): Promise<TokenResponse>;
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
export declare function revokeAsync({ clientId, issuer, serviceConfiguration }: OAuthBaseProps, { token, isClientIdProvided }: OAuthRevokeOptions): Promise<any>;
export declare const 
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
OAuthRedirect: any, 
/** @deprecated `expo-app-auth` has been deprecated in favor of `expo-auth-session`. [Learn more](https://expo.fyi/expo-app-auth-deprecated). */
URLSchemes: any;

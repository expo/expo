import { OAuthACRValuesParameter, OAuthBaseProps, OAuthDisplayParameter, OAuthIDTokenHintParameter, OAuthLoginHintParameter, OAuthMaxAgeParameter, OAuthNonceParameter, OAuthParameters, OAuthPromptParameter, OAuthProps, OAuthRevokeOptions, OAuthServiceConfiguration, OAuthUILocalesParameter, TokenResponse } from './AppAuth.types';
export { OAuthServiceConfiguration, OAuthDisplayParameter, OAuthPromptParameter, OAuthNonceParameter, OAuthUILocalesParameter, OAuthIDTokenHintParameter, OAuthMaxAgeParameter, OAuthLoginHintParameter, OAuthACRValuesParameter, OAuthParameters, OAuthBaseProps, OAuthProps, OAuthRevokeOptions, TokenResponse, };
export declare function authAsync(props: OAuthProps): Promise<TokenResponse>;
export declare function refreshAsync(props: OAuthProps, refreshToken: string): Promise<TokenResponse>;
export declare function revokeAsync({ clientId, issuer, serviceConfiguration }: OAuthBaseProps, { token, isClientIdProvided }: OAuthRevokeOptions): Promise<any>;
export declare const OAuthRedirect: any, URLSchemes: any;

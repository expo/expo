export declare type OAuthServiceConfiguration = {
    revocationEndpoint?: string;
    authorizationEndpoint?: string;
    registrationEndpoint?: string;
    tokenEndpoint: string;
};
export declare type OAuthDisplayParameter = 'page' | 'popup' | 'touch' | 'wap';
export declare type OAuthPromptParameter = 'none' | 'login' | 'consent' | 'select_account';
export declare type OAuthNonceParameter = string;
export declare type OAuthUILocalesParameter = string;
export declare type OAuthIDTokenHintParameter = string;
export declare type OAuthMaxAgeParameter = string;
export declare type OAuthLoginHintParameter = string;
export declare type OAuthACRValuesParameter = string;
export declare type OAuthParameters = {
    nonce?: OAuthNonceParameter;
    display?: OAuthDisplayParameter;
    prompt?: OAuthPromptParameter;
    max_age?: OAuthMaxAgeParameter;
    ui_locales?: OAuthUILocalesParameter;
    id_token_hint?: OAuthIDTokenHintParameter;
    login_hint?: OAuthLoginHintParameter;
    acr_values?: OAuthACRValuesParameter;
    [key: string]: any;
};
export declare type OAuthBaseProps = {
    clientId: string;
    issuer: string;
    serviceConfiguration?: OAuthServiceConfiguration;
};
export declare type OAuthProps = OAuthBaseProps & {
    redirectUrl?: string;
    clientSecret?: string;
    scopes?: string[];
    additionalParameters?: OAuthParameters;
    canMakeInsecureRequests?: boolean;
    isRefresh?: boolean;
    refreshToken?: string;
};
export declare type OAuthRevokeOptions = {
    token: string;
    isClientIdProvided?: boolean;
};
export declare type TokenResponse = {
    accessToken: string | null;
    accessTokenExpirationDate: string | null;
    additionalParameters: {
        [key: string]: any;
    } | null;
    idToken: string | null;
    tokenType: string | null;
    refreshToken: string | null;
};

import * as Application from 'expo-application';
import { useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { useAuthRequestResult, useLoadedAuthRequest } from '../AuthRequestHooks';
import { AuthRequest, generateHexStringAsync, makeRedirectUri, Prompt, ResponseType, } from '../AuthSession';
import { AccessTokenRequest } from '../TokenRequest';
import { applyRequiredScopes, invariantClientId, useProxyEnabled } from './ProviderUtils';
const settings = {
    windowFeatures: { width: 515, height: 680 },
    minimumScopes: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    ],
};
export const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    userInfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
};
class GoogleAuthRequest extends AuthRequest {
    nonce;
    constructor({ language, loginHint, selectAccount, extraParams = {}, clientSecret, ...config }) {
        const inputParams = {
            ...extraParams,
        };
        if (language)
            inputParams.hl = language;
        if (loginHint)
            inputParams.login_hint = loginHint;
        if (selectAccount)
            inputParams.prompt = Prompt.SelectAccount;
        // Apply the default scopes
        const scopes = applyRequiredScopes(config.scopes, settings.minimumScopes);
        const isImplicit = config.responseType === ResponseType.Token || config.responseType === ResponseType.IdToken;
        if (isImplicit) {
            // PKCE must be disabled in implicit mode.
            config.usePKCE = false;
        }
        let inputClientSecret;
        //  Google will throw if you attempt to use the client secret
        if (config.responseType && config.responseType !== ResponseType.Code) {
            // TODO: maybe warn that you shouldn't store the client secret on the client
            inputClientSecret = clientSecret;
        }
        super({
            ...config,
            clientSecret: inputClientSecret,
            scopes,
            extraParams: inputParams,
        });
    }
    /**
     * Load and return a valid auth request based on the input config.
     */
    async getAuthRequestConfigAsync() {
        const { extraParams = {}, ...config } = await super.getAuthRequestConfigAsync();
        if (config.responseType === ResponseType.IdToken && !extraParams.nonce && !this.nonce) {
            if (!this.nonce) {
                this.nonce = await generateHexStringAsync(16);
            }
            extraParams.nonce = this.nonce;
        }
        return {
            ...config,
            extraParams,
        };
    }
}
/**
 * Load an authorization request with an ID Token for authentication with Firebase.
 *
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 * The id token can be retrieved with `response.params.id_token`.
 *
 * - [Get Started](https://docs.expo.io/guides/authentication/#google)
 *
 * @param config
 * @param redirectUriOptions
 */
export function useIdTokenAuthRequest(config, redirectUriOptions = {}) {
    const useProxy = useProxyEnabled(redirectUriOptions);
    const isWebAuth = useProxy || Platform.OS === 'web';
    return useAuthRequest({
        ...config,
        responseType: 
        // If the client secret is provided then code can be used
        !config.clientSecret &&
            // When web auth is used, we can request the `id_token` directly without exchanging a code.
            isWebAuth
            ? ResponseType.IdToken
            : undefined,
    }, { ...redirectUriOptions, useProxy });
}
/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes, then the response will be fulfilled.
 *
 * - [Get Started](https://docs.expo.io/guides/authentication/#google)
 *
 * @param config
 * @param redirectUriOptions
 */
export function useAuthRequest(config = {}, redirectUriOptions = {}) {
    const useProxy = useProxyEnabled(redirectUriOptions);
    const clientId = useMemo(() => {
        const propertyName = useProxy
            ? 'expoClientId'
            : Platform.select({
                ios: 'iosClientId',
                android: 'androidClientId',
                default: 'webClientId',
            });
        const clientId = config[propertyName] ?? config.clientId;
        invariantClientId(propertyName, clientId, 'Google');
        return clientId;
    }, [
        useProxy,
        config.expoClientId,
        config.iosClientId,
        config.androidClientId,
        config.webClientId,
        config.clientId,
    ]);
    const responseType = useMemo(() => {
        // Allow overrides.
        if (typeof config.responseType !== 'undefined') {
            return config.responseType;
        }
        // You can only use `response_token=code` on installed apps (iOS, Android without proxy).
        // Installed apps can auto exchange without a client secret and get the token and id-token (Firebase).
        const isInstalledApp = Platform.OS !== 'web' && !useProxy;
        // If the user provided the client secret (they shouldn't!) then use code exchange by default.
        if (config.clientSecret || isInstalledApp) {
            return ResponseType.Code;
        }
        // This seems the most pragmatic option since it can result in a full authentication on web and proxy platforms as expected.
        return ResponseType.Token;
    }, [config.responseType, config.clientSecret, useProxy]);
    const redirectUri = useMemo(() => {
        if (typeof config.redirectUri !== 'undefined') {
            return config.redirectUri;
        }
        return makeRedirectUri({
            native: `${Application.applicationId}:/oauthredirect`,
            useProxy,
            ...redirectUriOptions,
            // native: `com.googleusercontent.apps.${guid}:/oauthredirect`,
        });
    }, [useProxy, config.redirectUri, redirectUriOptions]);
    const extraParams = useMemo(() => {
        const output = config.extraParams ? { ...config.extraParams } : {};
        if (config.language) {
            output.hl = output.language;
        }
        if (config.loginHint) {
            output.login_hint = output.loginHint;
        }
        if (config.selectAccount) {
            output.prompt = Prompt.SelectAccount;
        }
        return output;
    }, [config.extraParams, config.language, config.loginHint, config.selectAccount]);
    const request = useLoadedAuthRequest({
        ...config,
        responseType,
        extraParams,
        clientId,
        redirectUri,
    }, discovery, GoogleAuthRequest);
    const [result, promptAsync] = useAuthRequestResult(request, discovery, {
        useProxy,
        windowFeatures: settings.windowFeatures,
    });
    const [fullResult, setFullResult] = useState(null);
    const shouldAutoExchangeCode = useMemo(() => {
        // allow overrides
        if (typeof config.shouldAutoExchangeCode !== 'undefined') {
            return config.shouldAutoExchangeCode;
        }
        // has a code to exchange and doesn't have an authentication yet.
        const couldAutoExchange = result?.type === 'success' && result.params.code && !result.authentication;
        return couldAutoExchange;
    }, [config.shouldAutoExchangeCode, result?.type]);
    useEffect(() => {
        let isMounted = true;
        if (shouldAutoExchangeCode && result?.type === 'success') {
            const exchangeRequest = new AccessTokenRequest({
                clientId,
                clientSecret: config.clientSecret,
                redirectUri,
                scopes: config.scopes,
                code: result.params.code,
                extraParams: {
                    // @ts-ignore: allow for instances where PKCE is disabled
                    code_verifier: request.codeVerifier,
                },
            });
            exchangeRequest.performAsync(discovery).then((authentication) => {
                if (isMounted) {
                    setFullResult({
                        ...result,
                        params: {
                            // @ts-ignore: provide a singular interface for getting the id_token across all workflows that request it.
                            id_token: authentication.idToken,
                            access_token: authentication.accessToken,
                            ...result.params,
                        },
                        authentication,
                    });
                }
            });
        }
        else {
            setFullResult(result);
        }
        return () => {
            isMounted = false;
        };
    }, [
        clientId,
        redirectUri,
        shouldAutoExchangeCode,
        config.clientSecret,
        config.scopes?.join(','),
        request?.codeVerifier,
        result,
    ]);
    return [request, fullResult, promptAsync];
}
//# sourceMappingURL=Google.js.map
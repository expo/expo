import { useEffect, useState } from 'react';
import { useAuthRequestResult, useLoadedAuthRequest } from '../AuthRequestHooks';
import { AuthRequest, ResponseType, fetchUserInfoAsync as _fetchUserInfoAsync, } from '../AuthSession';
import { AccessTokenRequest } from '../TokenRequest';
const settings = {
    windowFeatures: { width: 500, height: 680 },
    // user-read-email is required for fetching the user profile, this is fairly opinionated but
    // it provides the best parity with Facebook and Google auth.
    minimumScopes: ['user-read-email'],
};
export const discovery = {
    authorizationEndpoint: 'https://accounts.spotify.com/authorize',
    tokenEndpoint: 'https://accounts.spotify.com/api/token',
    userInfoEndpoint: `https://api.spotify.com/v1/me`,
};
function applyRequiredScopes(scopes = []) {
    // Add the required scopes for returning profile data.
    const requiredScopes = [...scopes, ...settings.minimumScopes];
    // Remove duplicates
    return [...new Set(requiredScopes)];
}
class SpotifyAuthRequest extends AuthRequest {
    constructor({ language, selectAccount, extraParams = {}, clientSecret, ...config }) {
        const inputParams = {
            ...extraParams,
        };
        // TODO: Verify this works
        if (language) {
            inputParams.language = language;
        }
        if (typeof inputParams.show_dialog === 'undefined' && selectAccount) {
            inputParams.show_dialog = 'true';
        }
        // Apply the default scopes
        const scopes = applyRequiredScopes(config.scopes);
        const responseType = config.responseType ?? ResponseType.Code;
        let inputClientSecret;
        //  Spotify will throw if you attempt to use the client secret
        if (responseType !== ResponseType.Code) {
            // TODO: maybe warn that you shouldn't store the client secret on the client
            inputClientSecret = clientSecret;
        }
        // auto set PKCE to true for authorization code flow and false for implicit flow
        // this can be overwritten by defining a `usePKCE` parameter.
        if (typeof config.usePKCE === 'undefined') {
            config.usePKCE = responseType === ResponseType.Code;
        }
        super({
            ...config,
            clientSecret: inputClientSecret,
            scopes,
            extraParams: inputParams,
        });
    }
}
/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 *  - TODO: Put Getting started guide URL here
 *
 * @param config
 * @param discovery
 */
export function useAuthRequest(config) {
    const request = useLoadedAuthRequest(config, discovery, SpotifyAuthRequest);
    const [result, promptAsync] = useAuthRequestResult(request, discovery, {
        windowFeatures: settings.windowFeatures,
    });
    const [fullResult, setFullResult] = useState(null);
    // TODO add user info
    useEffect(() => {
        let isMounted = true;
        if (!fullResult &&
            config.clientSecret &&
            request?.responseType === ResponseType.Code &&
            result?.type === 'success') {
            console.log('try: ', fullResult, config.clientSecret, request?.responseType, result?.type);
            const exchangeRequest = new AccessTokenRequest({
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                redirectUri: config.redirectUri,
                scopes: config.scopes,
                code: result.params.code,
                extraParams: {
                    // @ts-ignore: allow for instances where PKCE is disabled
                    code_verifier: request.codeVerifier,
                },
            });
            exchangeRequest
                .performAsync(discovery)
                .then(authentication => {
                console.log('SUCCESS', authentication);
                if (isMounted) {
                    setFullResult({
                        ...result,
                        authentication,
                    });
                }
            })
                .catch(error => {
                console.log('FAILED', error);
            });
        }
        else {
            setFullResult(result);
        }
        return () => {
            isMounted = false;
        };
    }, [
        config.clientId,
        config.clientSecret,
        config.redirectUri,
        config.scopes?.join(','),
        request?.codeVerifier,
        request?.responseType,
        config.responseType,
        result,
        fullResult,
    ]);
    return [request, fullResult, promptAsync];
}
/**
 * Fetch generic user info from the provider's OpenID Connect `userInfoEndpoint` (if supported).
 *
 * [UserInfo](https://openid.net/specs/openid-connect-core-1_0.html#UserInfo)
 *
 * @param config The `accessToken` for a user, returned from a code exchange or auth request.
 * @param discovery The `userInfoEndpoint` for a provider.
 */
export async function fetchUserInfoAsync(response) {
    const providerData = await _fetchUserInfoAsync(response, discovery);
    const user = {
        name: providerData.display_name,
        email: providerData.email,
        id: providerData.id,
        picture: providerData.images?.[0]?.url,
        providerData,
    };
    return user;
}
//# sourceMappingURL=Spotify.js.map
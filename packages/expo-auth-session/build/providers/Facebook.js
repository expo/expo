import Constants from 'expo-constants';
import { useMemo } from 'react';
import { Platform } from 'react-native';
import { useAuthRequestResult, useLoadedAuthRequest } from '../AuthRequestHooks';
import { AuthRequest, makeRedirectUri, ResponseType, } from '../AuthSession';
import { generateHexStringAsync } from '../PKCE';
const settings = {
    windowFeatures: { width: 700, height: 600 },
    // These are required for Firebase to work properly which is a reasonable default.
    minimumScopes: ['public_profile', 'email'],
};
export const discovery = {
    authorizationEndpoint: 'https://www.facebook.com/v6.0/dialog/oauth',
    tokenEndpoint: 'https://graph.facebook.com/v6.0/oauth/access_token',
};
function applyRequiredScopes(scopes = []) {
    // Add the required scopes for returning profile data.
    const requiredScopes = [...scopes, ...settings.minimumScopes];
    // Remove duplicates
    return [...new Set(requiredScopes)];
}
class FacebookAuthRequest extends AuthRequest {
    constructor({ language, 
    // Account selection cannot be reliably emulated on Facebook.
    extraParams = {}, clientSecret, ...config }) {
        const inputParams = {
            display: 'popup',
            ...extraParams,
        };
        if (language) {
            inputParams.locale = language;
        }
        // Apply the default scopes
        const scopes = applyRequiredScopes(config.scopes);
        let inputClientSecret;
        //  Facebook will throw if you attempt to use the client secret
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
        if (!extraParams.nonce && !this.nonce) {
            if (!this.nonce) {
                this.nonce = await generateHexStringAsync(16);
            }
            extraParams.auth_nonce = this.nonce;
        }
        return {
            ...config,
            extraParams,
        };
    }
}
// Only natively in the Expo client.
function shouldUseProxy() {
    return Platform.select({
        web: false,
        // Use the proxy in the Expo client.
        default: !!Constants.manifest && Constants.appOwnership !== 'standalone',
    });
}
/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 * - [Get Started](https://docs.expo.io/guides/authentication/#facebook)
 *
 * @param config
 * @param discovery
 */
export function useAuthRequest(config = {}, redirectUriOptions = {}) {
    const useProxy = useMemo(() => redirectUriOptions.useProxy ?? shouldUseProxy(), [
        redirectUriOptions.useProxy,
    ]);
    const clientId = useMemo(() => {
        const propertyName = useProxy
            ? 'expoClientId'
            : Platform.select({
                ios: 'iosClientId',
                android: 'androidClientId',
                default: 'webClientId',
            });
        return config[propertyName] ?? config.clientId;
    }, [
        useProxy,
        config.expoClientId,
        config.iosClientId,
        config.androidClientId,
        config.webClientId,
        config.clientId,
    ]);
    const redirectUri = useMemo(() => {
        if (typeof config.redirectUri !== 'undefined') {
            return config.redirectUri;
        }
        return makeRedirectUri({
            native: `fb${clientId}://authorize`,
            useProxy,
            ...redirectUriOptions,
        });
    }, [useProxy, clientId, config.redirectUri, redirectUriOptions]);
    const extraParams = useMemo(() => {
        const output = config.extraParams ? { ...config.extraParams } : {};
        if (config.language) {
            output.locale = config.language;
        }
        return output;
    }, [config.extraParams, config.language]);
    const request = useLoadedAuthRequest({
        ...config,
        extraParams,
        clientId,
        redirectUri,
    }, discovery, FacebookAuthRequest);
    const [result, promptAsync] = useAuthRequestResult(request, discovery, {
        windowFeatures: settings.windowFeatures,
        useProxy,
    });
    return [request, result, promptAsync];
}
//# sourceMappingURL=Facebook.js.map
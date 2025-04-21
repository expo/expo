import { useCallback, useMemo, useEffect, useState } from 'react';
import { AuthRequest } from './AuthRequest';
import { resolveDiscoveryAsync } from './Discovery';
// @needsAudit
/**
 * Given an OpenID Connect issuer URL, this will fetch and return the [`DiscoveryDocument`](#discoverydocument)
 * (a collection of URLs) from the resource provider.
 *
 * @param issuerOrDiscovery URL using the `https` scheme with no query or fragment component that the OP asserts as its Issuer Identifier.
 * @return Returns `null` until the [`DiscoveryDocument`](#discoverydocument) has been fetched from the provided issuer URL.
 *
 * @example
 * ```ts
 * const discovery = useAutoDiscovery('https://example.com/auth');
 * ```
 */
export function useAutoDiscovery(issuerOrDiscovery) {
    const [discovery, setDiscovery] = useState(null);
    useEffect(() => {
        let isAllowed = true;
        resolveDiscoveryAsync(issuerOrDiscovery).then((discovery) => {
            if (isAllowed) {
                setDiscovery(discovery);
            }
        });
        return () => {
            isAllowed = false;
        };
    }, [issuerOrDiscovery]);
    return discovery;
}
export function useLoadedAuthRequest(config, discovery, AuthRequestInstance) {
    const [request, setRequest] = useState(null);
    const scopeString = config.scopes?.join(' ');
    const promptString = createPromptString(config.prompt);
    const extraParamsString = useMemo(() => JSON.stringify(config.extraParams || {}), [config.extraParams]);
    useEffect(() => {
        let isMounted = true;
        if (discovery) {
            const request = new AuthRequestInstance(config);
            request.makeAuthUrlAsync(discovery).then(() => {
                if (isMounted) {
                    setRequest(request);
                }
            });
        }
        return () => {
            isMounted = false;
        };
    }, [
        discovery?.authorizationEndpoint,
        config.clientId,
        config.redirectUri,
        config.responseType,
        config.clientSecret,
        config.codeChallenge,
        config.state,
        config.usePKCE,
        scopeString,
        promptString,
        extraParamsString,
    ]);
    return request;
}
/**
 * @returns Prompt type converted to a primitive value to be used as a React hook dependency
 */
function createPromptString(prompt) {
    if (!prompt) {
        return;
    }
    if (Array.isArray(prompt)) {
        return prompt.join(' ');
    }
    return prompt;
}
export function useAuthRequestResult(request, discovery, customOptions = {}) {
    const [result, setResult] = useState(null);
    const promptAsync = useCallback(async ({ windowFeatures = {}, ...options } = {}) => {
        if (!discovery || !request) {
            throw new Error('Cannot prompt to authenticate until the request has finished loading.');
        }
        const inputOptions = {
            ...customOptions,
            ...options,
            windowFeatures: {
                ...(customOptions.windowFeatures ?? {}),
                ...windowFeatures,
            },
        };
        const result = await request?.promptAsync(discovery, inputOptions);
        setResult(result);
        return result;
    }, [request?.url, discovery?.authorizationEndpoint]);
    return [result, promptAsync];
}
// @needsAudit
/**
 * Load an authorization request for a code. When the prompt method completes then the response will be fulfilled.
 *
 * > In order to close the popup window on web, you need to invoke `WebBrowser.maybeCompleteAuthSession()`.
 * > See the [GitHub example](/guides/authentication#github) for more info.
 *
 * If an Implicit grant flow was used, you can pass the `response.params` to `TokenResponse.fromQueryParams()`
 * to get a `TokenResponse` instance which you can use to easily refresh the token.
 *
 * @param config A valid [`AuthRequestConfig`](#authrequestconfig) that specifies what provider to use.
 * @param discovery A loaded [`DiscoveryDocument`](#discoverydocument) with endpoints used for authenticating.
 * Only `authorizationEndpoint` is required for requesting an authorization code.
 *
 * @return Returns a loaded request, a response, and a prompt method in a single array in the following order:
 * - `request` - An instance of [`AuthRequest`](#authrequest) that can be used to prompt the user for authorization.
 *   This will be `null` until the auth request has finished loading.
 * - `response` - This is `null` until `promptAsync` has been invoked. Once fulfilled it will return information about the authorization.
 * - `promptAsync` - When invoked, a web browser will open up and prompt the user for authentication.
 *   Accepts an [`AuthRequestPromptOptions`](#authrequestpromptoptions) object with options about how the prompt will execute.
 *
 * @example
 * ```ts
 * const [request, response, promptAsync] = useAuthRequest({ ... }, { ... });
 * ```
 */
export function useAuthRequest(config, discovery) {
    const request = useLoadedAuthRequest(config, discovery, AuthRequest);
    const [result, promptAsync] = useAuthRequestResult(request, discovery);
    return [request, result, promptAsync];
}
//# sourceMappingURL=AuthRequestHooks.js.map
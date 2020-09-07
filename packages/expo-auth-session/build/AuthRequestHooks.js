import { useCallback, useMemo, useEffect, useState } from 'react';
import { AuthRequest } from './AuthRequest';
import { resolveDiscoveryAsync } from './Discovery';
/**
 * Fetch the discovery document from an OpenID Connect issuer.
 *
 * @param issuerOrDiscovery
 */
export function useAutoDiscovery(issuerOrDiscovery) {
    const [discovery, setDiscovery] = useState(null);
    useEffect(() => {
        resolveDiscoveryAsync(issuerOrDiscovery).then(discovery => {
            setDiscovery(discovery);
        });
    }, [issuerOrDiscovery]);
    return discovery;
}
export function useLoadedAuthRequest(config, discovery, AuthRequestInstance) {
    const [request, setRequest] = useState(null);
    const scopeString = useMemo(() => config.scopes?.join(','), [config.scopes]);
    const extraParamsString = useMemo(() => JSON.stringify(config.extraParams || {}), [
        config.extraParams,
    ]);
    useEffect(() => {
        let isMounted = true;
        if (discovery) {
            const request = new AuthRequestInstance(config);
            request.makeAuthUrlAsync(discovery).then(() => {
                if (isMounted) {
                    // @ts-ignore
                    setRequest(request);
                }
            });
        }
        return () => {
            isMounted = false;
        };
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        discovery?.authorizationEndpoint,
        config.clientId,
        config.redirectUri,
        config.responseType,
        config.prompt,
        config.clientSecret,
        config.codeChallenge,
        config.state,
        config.usePKCE,
        scopeString,
        extraParamsString,
    ]);
    return request;
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
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [request?.url, discovery?.authorizationEndpoint]);
    return [result, promptAsync];
}
/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 * @param config
 * @param discovery
 */
export function useAuthRequest(config, discovery) {
    const request = useLoadedAuthRequest(config, discovery, AuthRequest);
    const [result, promptAsync] = useAuthRequestResult(request, discovery);
    return [request, result, promptAsync];
}
//# sourceMappingURL=AuthRequestHooks.js.map
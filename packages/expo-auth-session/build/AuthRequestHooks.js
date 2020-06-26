import { useCallback, useEffect, useState } from 'react';
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
/**
 * Load an authorization request.
 * Returns a loaded request, a response, and a prompt method.
 * When the prompt method completes then the response will be fulfilled.
 *
 * @param config
 * @param discovery
 */
export function useAuthRequest(config, discovery) {
    const [request, setRequest] = useState(null);
    const [result, setResult] = useState(null);
    const promptAsync = useCallback(async (options = {}) => {
        if (!discovery || !request) {
            throw new Error('Cannot prompt to authenticate until the request has finished loading.');
        }
        const result = await request?.promptAsync(discovery, options);
        setResult(result);
        return result;
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [request?.url, discovery?.authorizationEndpoint]);
    useEffect(() => {
        if (discovery) {
            const request = new AuthRequest(config);
            request.makeAuthUrlAsync(discovery).then(() => setRequest(request));
        }
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
        discovery?.authorizationEndpoint,
        config.clientId,
        config.redirectUri,
        config.prompt,
        config.scopes.join(','),
        config.clientSecret,
        config.codeChallenge,
        config.state,
        JSON.stringify(config.extraParams || {}),
        config.usePKCE,
    ]);
    return [request, result, promptAsync];
}
//# sourceMappingURL=AuthRequestHooks.js.map
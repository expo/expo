import { useEffect, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { AuthRequest, clearQueryParams, maybeCompleteAuthRequestAfterRedirectAsync, } from './AuthRequest';
import { resolveDiscoveryAsync } from './Discovery';
import { requestAsync } from './Fetch';
import * as QueryParams from './QueryParams';
export function useLinking() {
    const [link, setLink] = useState(null);
    function onChange({ url }) {
        setLink(url);
    }
    useEffect(() => {
        Linking.getInitialURL().then(url => setLink(url));
        Linking.addEventListener('url', onChange);
        return () => {
            Linking.removeEventListener('url', onChange);
        };
    }, []);
    return link;
}
export function useQueryParams() {
    const [queryParams, setQueryParams] = useState(null);
    const link = useLinking();
    useEffect(() => {
        if (link) {
            const { params } = QueryParams.getQueryParams(link);
            setQueryParams(params);
        }
        else {
            setQueryParams(null);
        }
    }, [link]);
    return queryParams;
}
export function useDiscovery(issuerOrDiscovery) {
    const [discovery, setDiscovery] = useState(null);
    useEffect(() => {
        resolveDiscoveryAsync(issuerOrDiscovery).then(discovery => {
            setDiscovery(discovery);
        });
    }, [issuerOrDiscovery]);
    return discovery;
}
export function useJsonFetchRequest(accessToken, requestUrl, headers, method = 'GET') {
    const [json, setJson] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (accessToken) {
            requestAsync(requestUrl, {
                // @ts-ignore
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    ...headers,
                },
                method,
                dataType: 'json',
            })
                .then(json => {
                setJson(json);
                setError(null);
            })
                .catch(error => {
                setJson(null);
                setError(error);
            });
        }
    }, [accessToken]);
    return [json, error];
}
export function useCompleteRedirect() {
    if (Platform.OS !== 'web')
        return null;
    const [authState, setAuthState] = useState(null);
    const link = useLinking();
    useEffect(() => {
        if (link)
            maybeCompleteAuthRequestAfterRedirectAsync(link).then(result => {
                if (result) {
                    clearQueryParams();
                    setAuthState(result);
                }
            });
    }, [link]);
    return authState;
}
export function useAuthRequest(config) {
    const [request, setRequest] = useState(null);
    useEffect(() => {
        if (config) {
            AuthRequest.buildAsync({
                ...config,
            }).then(request => setRequest(request));
        }
    }, [
        config.clientId,
        config.redirectUri,
        config.scopes.join(','),
        config.clientSecret,
        config.codeChallenge,
        config.state,
        JSON.stringify(config.extraParams || {}),
        config.usePKCE,
        JSON.stringify(config.discovery || {}),
        config.issuer,
    ]);
    return request;
}
//# sourceMappingURL=AuthRequestHooks.js.map
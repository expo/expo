import { useState, useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { maybeCompleteAuthRequestAfterRedirectAsync, AuthRequest, } from './AuthRequest';
import { resolveDiscoveryAsync } from './Discovery';
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
export function clearQueryParams() {
    if (Platform.OS !== 'web')
        return;
    // Get the full URL.
    const currURL = window.location.href;
    const url = new window.URL(currURL);
    // Append the pathname to the origin (i.e. without the search).
    const nextUrl = url.origin + url.pathname;
    // Here you pass the new URL extension you want to appear after the domains '/'. Note that the previous identifiers or "query string" will be replaced.
    window.history.pushState({}, window.document.title, nextUrl);
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
            const authRequest = new AuthRequest({
                ...config,
            });
            authRequest.buildUrlAsync().then(() => setRequest(authRequest));
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
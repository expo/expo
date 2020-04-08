import * as WebBrowser from 'expo-web-browser';
import invariant from 'invariant';
import { Platform } from 'react-native';
import { resolveDiscoveryAsync } from './Discovery';
import { AuthResponseError } from './Errors';
import * as PKCE from './PKCE';
import * as QueryParams from './QueryParams';
import { getSessionUrlProvider } from './SessionUrlProvider';
const sessionUrlProvider = getSessionUrlProvider();
let _authLock = false;
export var CodeChallengeMethod;
(function (CodeChallengeMethod) {
    CodeChallengeMethod["S256"] = "S256";
    CodeChallengeMethod["Plain"] = "plain";
})(CodeChallengeMethod || (CodeChallengeMethod = {}));
/**
 * The client informs the authorization server of the
 * desired grant type by using the a response type.
 *
 * https://tools.ietf.org/html/rfc6749#section-3.1.1
 */
export var ResponseType;
(function (ResponseType) {
    /**
     * For requesting an authorization code as described by [Section 4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1).
     */
    ResponseType["Code"] = "code";
    /**
     * for requesting an access token (implicit grant) as described by [Section 4.2.1](https://tools.ietf.org/html/rfc6749#section-4.2.1).
     */
    ResponseType["Token"] = "token";
})(ResponseType || (ResponseType = {}));
/**
 * Represents the authorization request.
 * For more information look at
 * https://tools.ietf.org/html/rfc6749#section-4.1.1
 */
export class AuthRequest {
    constructor(request) {
        this.url = null;
        this.responseType = request.responseType ?? ResponseType.Code;
        this.clientId = request.clientId;
        this.redirectUri = request.redirectUri;
        this.scopes = request.scopes;
        this.clientSecret = request.clientSecret;
        this.state = request.state ?? PKCE.generateRandomAsync(10);
        this.extraParams = request.extraParams ?? {};
        this.codeChallengeMethod = request.codeChallengeMethod ?? CodeChallengeMethod.S256;
        // PKCE defaults to true
        this.usePKCE = request.usePKCE ?? true;
        invariant(this.redirectUri, `\`AuthRequest\` requires a valid \`redirectUri\`. Ex: ${Platform.select({
            web: 'https://yourwebsite.com/',
            default: 'com.your.app:/oauthredirect',
        })}`);
    }
    static async buildAsync(config, issuerOrDiscovery) {
        const request = new AuthRequest(config);
        const discovery = await resolveDiscoveryAsync(issuerOrDiscovery);
        await request.buildUrlAsync(discovery);
        return request;
    }
    async getAuthRequestConfigAsync() {
        if (this.usePKCE) {
            await this.ensureCodeIsSetupAsync();
        }
        return {
            responseType: this.responseType,
            clientId: this.clientId,
            redirectUri: this.redirectUri,
            scopes: this.scopes,
            clientSecret: this.clientSecret,
            codeChallenge: this.codeChallenge,
            codeChallengeMethod: this.codeChallengeMethod,
            state: await this.getStateAsync(),
            extraParams: this.extraParams,
            usePKCE: this.usePKCE,
        };
    }
    async promptAsync(discovery, { url, ...options }) {
        // Reuse the preloaded url
        if (!(url ?? this.url)) {
            return this.promptAsync(discovery, {
                ...options,
                url: this.url ?? (await this.buildUrlAsync(discovery)),
            });
        }
        // Prevent accidentally starting to an empty url
        if (!url) {
            throw new Error('No authUrl provided to AuthSession.startAsync. An authUrl is required -- it points to the page where the user will be able to sign in.');
        }
        let startUrl = url;
        let returnUrl = this.redirectUri;
        if (options.useProxy) {
            returnUrl = sessionUrlProvider.getDefaultReturnUrl();
            startUrl = sessionUrlProvider.getStartUrl(url, returnUrl);
        }
        // Prevent multiple sessions from running at the same time, WebBrowser doesn't
        // support it this makes the behavior predictable.
        if (_authLock) {
            if (__DEV__) {
                console.warn('Attempted to call AuthSession.startAsync multiple times while already active. Only one AuthSession can be active at any given time.');
            }
            return { type: 'locked' };
        }
        // About to start session, set lock
        _authLock = true;
        let result;
        try {
            result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl, {
                showInRecents: options.showInRecents,
            });
        }
        finally {
            _authLock = false;
        }
        if (result.type === 'opened') {
            // This should never happen
            throw new Error('An unexpected error occurred');
        }
        if (result.type !== 'success') {
            return { type: result.type };
        }
        return await this.parseReturnUrlAsync(result.url);
    }
    async parseReturnUrlAsync(url) {
        const { params, errorCode } = QueryParams.getQueryParams(url);
        const { state, error = errorCode } = params;
        const shouldNotify = state === this.state;
        if (!shouldNotify) {
            throw new Error('Cached state and returned state do not match.');
        }
        else if (error) {
            return {
                type: 'error',
                errorCode,
                error: new AuthResponseError({ error, ...params }),
                url,
                params,
            };
        }
        return {
            type: 'success',
            errorCode,
            error: null,
            url,
            params,
        };
    }
    async buildUrlAsync(discovery) {
        const request = await this.getAuthRequestConfigAsync();
        if (!request.state)
            throw new Error('Cannot build request without a valid `state` loaded');
        // build the query string
        // coerce to any type for convenience
        let params = {};
        if (request.codeChallenge) {
            params.code_challenge = request.codeChallenge;
        }
        if (request.codeChallengeMethod) {
            params.code_challenge_method = request.codeChallengeMethod;
        }
        if (request.clientSecret) {
            params.client_secret = request.clientSecret;
        }
        // copy over extra params
        for (const extra in request.extraParams) {
            if (extra in request.extraParams) {
                params[extra] = request.extraParams[extra];
            }
        }
        // These overwrite any extra params
        params = {
            ...params,
            redirect_uri: request.redirectUri,
            client_id: request.clientId,
            response_type: request.responseType,
            state: request.state,
            scope: request.scopes.join(' '),
        };
        const query = QueryParams.buildQueryString(params);
        this.url = `${discovery.authorizationEndpoint}?${query}`;
        return this.url;
    }
    async getStateAsync() {
        if (this.state instanceof Promise)
            this.state = await this.state;
        return this.state;
    }
    async ensureCodeIsSetupAsync() {
        if (this.codeVerifier) {
            return;
        }
        // This method needs to be resolved like all other native methods.
        const { codeVerifier, codeChallenge } = await PKCE.buildCodeAsync();
        this.codeVerifier = codeVerifier;
        this.codeChallenge = codeChallenge;
    }
}
//# sourceMappingURL=AuthRequest.js.map
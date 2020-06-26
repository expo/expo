import * as WebBrowser from 'expo-web-browser';
import invariant from 'invariant';
import { Platform } from 'react-native';
import { CodeChallengeMethod, ResponseType, } from './AuthRequest.types';
import { AuthError } from './Errors';
import * as PKCE from './PKCE';
import * as QueryParams from './QueryParams';
import { getSessionUrlProvider } from './SessionUrlProvider';
const sessionUrlProvider = getSessionUrlProvider();
let _authLock = false;
/**
 * Implements an authorization request.
 *
 * [Section 4.1.1](https://tools.ietf.org/html/rfc6749#section-4.1.1)
 */
export class AuthRequest {
    constructor(request) {
        this.url = null;
        this.responseType = request.responseType ?? ResponseType.Code;
        this.clientId = request.clientId;
        this.redirectUri = request.redirectUri;
        this.scopes = request.scopes;
        this.clientSecret = request.clientSecret;
        this.prompt = request.prompt;
        this.state = request.state ?? PKCE.generateRandomAsync(10);
        this.extraParams = request.extraParams ?? {};
        this.codeChallengeMethod = request.codeChallengeMethod ?? CodeChallengeMethod.S256;
        // PKCE defaults to true
        this.usePKCE = request.usePKCE ?? true;
        // Some warnings in development about potential confusing application code
        if (__DEV__) {
            if (this.prompt && this.extraParams.prompt) {
                console.warn(`\`AuthRequest\` \`extraParams.prompt\` will be overwritten by \`prompt\`.`);
            }
            if (this.clientSecret && this.extraParams.client_secret) {
                console.warn(`\`AuthRequest\` \`extraParams.client_secret\` will be overwritten by \`clientSecret\`.`);
            }
            if (this.codeChallengeMethod && this.extraParams.code_challenge_method) {
                console.warn(`\`AuthRequest\` \`extraParams.code_challenge_method\` will be overwritten by \`codeChallengeMethod\`.`);
            }
        }
        invariant(this.codeChallengeMethod !== CodeChallengeMethod.Plain, `\`AuthRequest\` does not support \`CodeChallengeMethod.Plain\` as it's not secure.`);
        invariant(this.redirectUri, `\`AuthRequest\` requires a valid \`redirectUri\`. Ex: ${Platform.select({
            web: 'https://yourwebsite.com/',
            default: 'com.your.app:/oauthredirect',
        })}`);
    }
    /**
     * Load and return a valid auth request based on the input config.
     */
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
            prompt: this.prompt,
            state: await this.getStateAsync(),
            extraParams: this.extraParams,
            usePKCE: this.usePKCE,
        };
    }
    /**
     * Prompt a user to authorize for a code.
     *
     * @param discovery
     * @param promptOptions
     */
    async promptAsync(discovery, { url, ...options } = {}) {
        if (!url) {
            if (!this.url) {
                // Generate a new url
                return this.promptAsync(discovery, {
                    ...options,
                    url: await this.makeAuthUrlAsync(discovery),
                });
            }
            // Reuse the preloaded url
            url = this.url;
        }
        // Prevent accidentally starting to an empty url
        invariant(url, 'No authUrl provided to AuthSession.startAsync. An authUrl is required -- it points to the page where the user will be able to sign in.');
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
            const { useProxy, ...openOptions } = options;
            result = await WebBrowser.openAuthSessionAsync(startUrl, returnUrl, openOptions);
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
        return this.parseReturnUrl(result.url);
    }
    parseReturnUrl(url) {
        const { params, errorCode } = QueryParams.getQueryParams(url);
        const { state, error = errorCode } = params;
        let parsedError = null;
        if (state !== this.state) {
            // This is a non-standard error
            parsedError = new AuthError({
                error: 'state_mismatch',
                error_description: 'Cross-Site request verification failed. Cached state and returned state do not match.',
            });
        }
        else if (error) {
            parsedError = new AuthError({ error, ...params });
        }
        return {
            type: parsedError ? 'error' : 'success',
            error: parsedError,
            url,
            params,
            // Return errorCode for legacy
            errorCode,
        };
    }
    /**
     * Create the URL for authorization.
     *
     * @param discovery
     */
    async makeAuthUrlAsync(discovery) {
        const request = await this.getAuthRequestConfigAsync();
        if (!request.state)
            throw new Error('Cannot make request URL without a valid `state` loaded');
        // Create a query string
        const params = {};
        if (request.codeChallenge) {
            params.code_challenge = request.codeChallenge;
        }
        // copy over extra params
        for (const extra in request.extraParams) {
            if (extra in request.extraParams) {
                params[extra] = request.extraParams[extra];
            }
        }
        if (request.usePKCE && request.codeChallengeMethod) {
            params.code_challenge_method = request.codeChallengeMethod;
        }
        if (request.clientSecret) {
            params.client_secret = request.clientSecret;
        }
        if (request.prompt) {
            params.prompt = request.prompt;
        }
        // These overwrite any extra params
        params.redirect_uri = request.redirectUri;
        params.client_id = request.clientId;
        params.response_type = request.responseType;
        params.state = request.state;
        if (request.scopes.length) {
            params.scope = request.scopes.join(' ');
        }
        const query = QueryParams.buildQueryString(params);
        // Store the URL for later
        this.url = `${discovery.authorizationEndpoint}?${query}`;
        return this.url;
    }
    async getStateAsync() {
        // Resolve any pending state.
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
import { AuthRequest } from './AuthRequest';
import { AuthRequestConfig, AuthRequestPromptOptions } from './AuthRequest.types';
import { AuthSessionResult } from './AuthSession.types';
import { DiscoveryDocument, IssuerOrDiscovery } from './Discovery';
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
export declare function useAutoDiscovery(issuerOrDiscovery: IssuerOrDiscovery): DiscoveryDocument | null;
export declare function useLoadedAuthRequest(config: AuthRequestConfig, discovery: DiscoveryDocument | null, AuthRequestInstance: typeof AuthRequest): AuthRequest | null;
export type PromptMethod = (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>;
export declare function useAuthRequestResult(request: AuthRequest | null, discovery: DiscoveryDocument | null, customOptions?: AuthRequestPromptOptions): [AuthSessionResult | null, PromptMethod];
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
export declare function useAuthRequest(config: AuthRequestConfig, discovery: DiscoveryDocument | null): [
    AuthRequest | null,
    AuthSessionResult | null,
    (options?: AuthRequestPromptOptions) => Promise<AuthSessionResult>
];
//# sourceMappingURL=AuthRequestHooks.d.ts.map
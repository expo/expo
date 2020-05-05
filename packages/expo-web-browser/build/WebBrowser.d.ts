import { WebBrowserOpenOptions, WebBrowserAuthSessionResult, WebBrowserCustomTabsResults, WebBrowserResult, WebBrowserRedirectResult, WebBrowserMayInitWithUrlResult, WebBrowserWarmUpResult, WebBrowserCoolDownResult, WebBrowserResultType } from './WebBrowser.types';
export { WebBrowserOpenOptions, WebBrowserAuthSessionResult, WebBrowserCustomTabsResults, WebBrowserResult, WebBrowserRedirectResult, WebBrowserMayInitWithUrlResult, WebBrowserWarmUpResult, WebBrowserCoolDownResult, WebBrowserResultType, };
export declare function getCustomTabsSupportingBrowsersAsync(): Promise<WebBrowserCustomTabsResults>;
export declare function warmUpAsync(browserPackage?: string): Promise<WebBrowserWarmUpResult>;
export declare function mayInitWithUrlAsync(url: string, browserPackage?: string): Promise<WebBrowserMayInitWithUrlResult>;
export declare function coolDownAsync(browserPackage?: string): Promise<WebBrowserCoolDownResult>;
export declare function openBrowserAsync(url: string, browserParams?: WebBrowserOpenOptions): Promise<WebBrowserResult>;
export declare function dismissBrowser(): void;
export declare function openAuthSessionAsync(url: string, redirectUrl: string, browserParams?: WebBrowserOpenOptions): Promise<WebBrowserAuthSessionResult>;
export declare function dismissAuthSession(): void;
/**
 * Attempts to complete an auth session in the browser.
 *
 * @param options
 */
export declare function maybeCompleteAuthSession(options?: {
    skipRedirectCheck?: boolean;
}): {
    type: 'success' | 'failed';
    message: string;
};

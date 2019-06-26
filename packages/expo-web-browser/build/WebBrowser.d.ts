import { OpenBrowserOptions, AuthSessionResult, CustomTabsBrowsersResults, BrowserResult, MayInitWithUrlResult, WarmUpResult, CoolDownResult } from './WebBrowser.types';
export declare function getCustomTabsSupportingBrowsersAsync(): Promise<CustomTabsBrowsersResults>;
export declare function warmUpAsync(browserPackage?: string): Promise<WarmUpResult>;
export declare function mayInitWithUrlAsync(url: string, browserPackage?: string): Promise<MayInitWithUrlResult>;
export declare function coolDownAsync(browserPackage?: string): Promise<CoolDownResult>;
export declare function openBrowserAsync(url: string, browserParams?: OpenBrowserOptions): Promise<BrowserResult>;
export declare function dismissBrowser(): void;
export declare function openAuthSessionAsync(url: string, redirectUrl: string): Promise<AuthSessionResult>;
export declare function dismissAuthSession(): void;

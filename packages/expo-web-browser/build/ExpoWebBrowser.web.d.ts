import { WebBrowserAuthSessionResult, WebBrowserOpenOptions, WebBrowserResult } from './WebBrowser.types';
declare const _default: {
    readonly name: string;
    openBrowserAsync(url: string, browserParams?: WebBrowserOpenOptions): Promise<WebBrowserResult>;
    dismissAuthSession(): void;
    maybeCompleteAuthSession({ skipRedirectCheck, }: {
        skipRedirectCheck?: boolean | undefined;
    }): {
        type: 'success' | 'failed';
        message: string;
    };
    openAuthSessionAsync(url: string, redirectUrl?: string | undefined, openOptions?: WebBrowserOpenOptions | undefined): Promise<WebBrowserAuthSessionResult>;
};
export default _default;
export declare function featureObjectToString(features: Record<string, any>): string;

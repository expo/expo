import { SessionUrlProvider } from './SessionUrlProvider';
export declare class BareSessionUrlProvider implements SessionUrlProvider {
    getDefaultReturnUrl(): string;
    getStartUrl(authUrl: string, _returnUrl: string): string;
    getRedirectUrl(urlPath?: string): string;
}

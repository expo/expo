declare type AuthSessionOptions = {
    authUrl: string;
    returnUrl?: string;
};
declare type AuthSessionResult = {
    type: 'cancel' | 'dismiss' | 'locked';
} | {
    type: 'error' | 'success';
    errorCode: string | null;
    params: {
        [key: string]: string;
    };
    url: string;
};
declare function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult>;
declare function dismiss(): void;
declare function getStartUrl(authUrl: string, returnUrl: string): string;
declare function getRedirectUrl(): string;
declare function getDefaultReturnUrl(): string;
declare const _default: {
    dismiss: typeof dismiss;
    getRedirectUrl: typeof getRedirectUrl;
    getStartUrl: typeof getStartUrl;
    getDefaultReturnUrl: typeof getDefaultReturnUrl;
    readonly getRedirectUri: typeof getRedirectUrl;
    startAsync: typeof startAsync;
};
export default _default;

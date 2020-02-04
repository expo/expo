import { AuthSessionOptions, AuthSessionResult } from './AuthSession.types';
export declare function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult>;
export declare function dismiss(): void;
export declare function getStartUrl(authUrl: string, returnUrl: string): string;
export declare function getRedirectUrl(): string;
export declare function getDefaultReturnUrl(): string;

import { getDefaultReturnUrl, getRedirectUrl } from './SessionUrlProvider';
import { AuthSessionOptions, AuthSessionResult } from './AuthSession.types';
export declare function startAsync(options: AuthSessionOptions): Promise<AuthSessionResult>;
export declare function dismiss(): void;
export { getDefaultReturnUrl, getRedirectUrl };

import { LocalAuthenticationOptions, AuthenticationType, LocalAuthenticationResult, SecurityLevel } from './LocalAuthentication.types';
export { LocalAuthenticationOptions, AuthenticationType, LocalAuthenticationResult, SecurityLevel };
export declare function hasHardwareAsync(): Promise<boolean>;
export declare function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
export declare function isEnrolledAsync(): Promise<boolean>;
export declare function getEnrolledLevelAsync(): Promise<SecurityLevel>;
export declare function authenticateAsync(options?: LocalAuthenticationOptions): Promise<LocalAuthenticationResult>;
export declare function cancelAuthenticate(): Promise<void>;

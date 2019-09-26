import { AuthenticationType } from './LocalAuthentication.types';
declare const _default: {
    readonly name: string;
    hasHardwareAsync(): Promise<boolean>;
    isEnrolledAsync(): Promise<boolean>;
    supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
};
export default _default;

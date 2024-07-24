import { AuthenticationType, SecurityLevel } from './LocalAuthentication.types';
declare const _default: {
    hasHardwareAsync(): Promise<boolean>;
    isEnrolledAsync(): Promise<boolean>;
    getEnrolledLevelAsync(): Promise<SecurityLevel>;
    supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
};
export default _default;
//# sourceMappingURL=ExpoLocalAuthentication.web.d.ts.map
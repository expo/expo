import { AuthenticationType, SecurityLevel } from './LocalAuthentication.types';

export default {
  async hasHardwareAsync(): Promise<boolean> {
    return false;
  },
  async isEnrolledAsync(): Promise<boolean> {
    return false;
  },
  async getEnrolledLevelAsync(): Promise<SecurityLevel> {
    return SecurityLevel.NONE;
  },
  async supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]> {
    return [];
  },
};

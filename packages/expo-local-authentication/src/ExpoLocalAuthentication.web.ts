import { AuthenticationType, SecurityLevel } from './LocalAuthentication.types';

export default {
  get name(): string {
    return 'ExpoLocalAuthentication';
  },
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

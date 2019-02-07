export type LocalAuthenticationResult = { success: true } | { success: false; error: string };

export enum AuthenticationType {
  FINGERPRINT = 1,
  FACIAL_RECOGNITION = 2,
}

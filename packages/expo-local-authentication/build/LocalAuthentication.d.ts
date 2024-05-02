import { LocalAuthenticationOptions, AuthenticationType, LocalAuthenticationResult, SecurityLevel, BiometricsSecurityLevel } from './LocalAuthentication.types';
export { LocalAuthenticationOptions, AuthenticationType, LocalAuthenticationResult, SecurityLevel, BiometricsSecurityLevel, };
/**
 * Determine whether a face or fingerprint scanner is available on the device.
 * @return Returns a promise which fulfils with a `boolean` value indicating whether a face or
 * fingerprint scanner is available on this device.
 */
export declare function hasHardwareAsync(): Promise<boolean>;
/**
 * Determine what kinds of authentications are available on the device.
 * @return Returns a promise which fulfils to an array containing [`AuthenticationType`s](#authenticationtype).
 *
 * Devices can support multiple authentication methods- i.e. `[1,2]` means the device supports both
 * fingerprint and facial recognition. If none are supported, this method returns an empty array.
 */
export declare function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
/**
 * Determine whether the device has saved fingerprints or facial data to use for authentication.
 * @return Returns a promise which fulfils to `boolean` value indicating whether the device has
 * saved fingerprints or facial data for authentication.
 */
export declare function isEnrolledAsync(): Promise<boolean>;
/**
 * Determine what kind of authentication is enrolled on the device.
 * @return Returns a promise which fulfils with [`SecurityLevel`](#securitylevel).
 * > **Note:** On Android devices prior to M, `SECRET` can be returned if only the SIM lock has been
 * enrolled, which is not the method that [`authenticateAsync`](#localauthenticationauthenticateasyncoptions)
 * prompts.
 */
export declare function getEnrolledLevelAsync(): Promise<SecurityLevel>;
/**
 * Attempts to authenticate via Fingerprint/TouchID (or FaceID if available on the device).
 * > **Note:** Apple requires apps which use FaceID to provide a description of why they use this API.
 * If you try to use FaceID on an iPhone with FaceID without providing `infoPlist.NSFaceIDUsageDescription`
 * in `app.json`, the module will authenticate using device passcode. For more information about
 * usage descriptions on iOS, see [permissions guide](/guides/permissions/#ios).
 * @param options
 * @return Returns a promise which fulfils with [`LocalAuthenticationResult`](#localauthenticationresult).
 */
export declare function authenticateAsync(options?: LocalAuthenticationOptions): Promise<LocalAuthenticationResult>;
/**
 * Cancels authentication flow.
 * @platform android
 */
export declare function cancelAuthenticate(): Promise<void>;
//# sourceMappingURL=LocalAuthentication.d.ts.map
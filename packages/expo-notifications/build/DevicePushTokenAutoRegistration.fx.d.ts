import 'abort-controller/polyfill';
/**
 * Encapsulates device server registration data
 */
export type DevicePushTokenRegistration = {
    isEnabled: boolean;
};
/**
 * @hidden - the comment is misleading and the purpose of the function needs to be reevaluated
 *
 * Sets the registration information so that the device push token gets pushed
 * to the given registration endpoint
 * @param enabled
 */
export declare function setAutoServerRegistrationEnabledAsync(enabled: boolean): Promise<void>;
export declare function __handlePersistedRegistrationInfoAsync(registrationInfo: string | null | undefined): Promise<void>;
//# sourceMappingURL=DevicePushTokenAutoRegistration.fx.d.ts.map
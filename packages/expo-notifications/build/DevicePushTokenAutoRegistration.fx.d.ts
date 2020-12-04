import 'abort-controller/polyfill';
/**
 * Encapsulates device server registration data
 */
export declare type DevicePushTokenRegistration = {
    isEnabled: boolean;
};
/**
 * Sets the registration information so that the device push token gets pushed
 * to the given registration endpoint
 * @param registration Registration endpoint to inform of new tokens
 */
export declare function setAutoServerRegistrationEnabledAsync(enabled: boolean): Promise<void>;
/**
 * This function is exported only for testing purposes.
 */
export declare function __handlePersistedRegistrationInfoAsync(registrationInfo: string | null | undefined): Promise<void>;

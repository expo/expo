import { DevicePushToken } from './Tokens.types';
/**
 * Encapsulates device server registration data
 */
export declare type DevicePushTokenRegistration = {
    url: string;
    body: Record<string, any>;
    pendingDevicePushToken?: DevicePushToken | null;
};
/**
 * Sets the last registration information so that the device push token gets
 * pushed to the given registration endpoint
 * @param registration Registration endpoint to inform of new tokens
 */
export declare function setAutoServerRegistrationAsync(registration: Omit<DevicePushTokenRegistration, 'pendingDevicePushToken'>): Promise<void>;
/**
 * Removes last Expo server registration, future device push token
 * updates won't get sent there anymore.
 */
export declare function removeAutoServerRegistrationAsync(): Promise<void>;
/**
 * This function is exported only for testing purposes.
 */
export declare function __handlePersistedRegistrationInfoAsync(lastRegistrationInfo: string | null | undefined): Promise<void>;

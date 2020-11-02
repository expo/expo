declare type Registration = {
    url: string;
    type?: string;
    deviceId?: string;
    development?: boolean;
    experienceId?: string;
    applicationId?: string;
};
/**
 * Sets the registration information to the persisted storage so that the device push token
 * gets pushed to the given registration endpoint, overridding previous registrations
 * @param registration Registration endpoint to inform of new tokens
 */
export declare function setAutoTokenRegistrationAsync(registration: Registration): Promise<void>;
export {};

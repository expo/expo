declare type Registration = {
    url: string;
    type?: string;
    deviceId?: string;
    development?: boolean;
    experienceId?: string;
    applicationId?: string;
};
/**
 * Adds the registration information to the persisted storage so that the device push token
 * gets pushed to the given registration endpoint
 * @param registration Registration endpoint to inform of new tokens
 */
export declare function addAutoTokenRegistrationAsync(registration: Registration): Promise<void>;
export {};

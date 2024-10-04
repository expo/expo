import JsonFile from '@expo/json-file';
export type UserSettingsData = {
    developmentCodeSigningId?: string;
    appleId?: string;
    accessToken?: string;
    auth?: UserData | null;
    ignoreBundledBinaries?: string[];
    openDevToolsAtStartup?: boolean;
    PATH?: string;
    sendTo?: string;
    uuid?: string;
};
export type UserData = {
    appleId?: string;
    userId?: string;
    username?: string;
    currentConnection?: ConnectionType;
    sessionSecret?: string;
};
export type ConnectionType = 'Access-Token-Authentication' | 'Username-Password-Authentication' | 'facebook' | 'google-oauth2' | 'github';
export declare function getExpoHomeDirectory(): string;
export declare function getUserStatePath(): string;
export declare function getUserState(): JsonFile<UserSettingsData>;

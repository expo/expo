type ProvisioningProfileSettings = {
    targetName?: string;
    appleTeamId: string;
    profileName: string;
    buildConfiguration?: string;
};
export declare const setProvisioningProfileForPbxproj: (applePlatform: 'ios' | 'macos') => (projectRoot: string, { targetName, profileName, appleTeamId, buildConfiguration, }: ProvisioningProfileSettings) => void;
export {};

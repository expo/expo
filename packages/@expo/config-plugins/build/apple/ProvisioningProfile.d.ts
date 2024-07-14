type ProvisioningProfileSettings = {
    targetName?: string;
    appleTeamId: string;
    profileName: string;
    buildConfiguration?: string;
};
export declare function setProvisioningProfileForPbxproj(projectRoot: string, applePlatform: 'ios' | 'macos', { targetName, profileName, appleTeamId, buildConfiguration, }: ProvisioningProfileSettings): void;
export {};

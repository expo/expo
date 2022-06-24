declare type ProvisioningProfileSettings = {
    targetName?: string;
    appleTeamId: string;
    profileName: string;
    buildConfiguration?: string;
};
export declare function setProvisioningProfileForPbxproj(projectRoot: string, { targetName, profileName, appleTeamId, buildConfiguration, }: ProvisioningProfileSettings): void;
export {};

type ProvisioningProfileSettings = {
    targetName?: string;
    appleTeamId: string;
    profileName: string;
    buildConfiguration?: string;
    codeSignIdentity?: string;
};
export declare function setProvisioningProfileForPbxproj(projectRoot: string, { targetName, profileName, appleTeamId, buildConfiguration, codeSignIdentity, }: ProvisioningProfileSettings): void;
export {};

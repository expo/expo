import { ModPlatform } from '../Plugin.types';
type ProvisioningProfileSettings = {
    targetName?: string;
    appleTeamId: string;
    profileName: string;
    buildConfiguration?: string;
};
export declare function setProvisioningProfileForPbxproj(projectRoot: string, platform: ModPlatform, { targetName, profileName, appleTeamId, buildConfiguration, }: ProvisioningProfileSettings): void;
export {};

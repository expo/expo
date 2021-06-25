import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare const withDocumentPickerIOS: ConfigPlugin<{
    appleTeamId?: string;
}>;
export declare function setICloudEntitlments(config: Pick<ExpoConfig, 'ios'>, appleTeamId: string, entitlements: Record<string, any>): Record<string, any>;

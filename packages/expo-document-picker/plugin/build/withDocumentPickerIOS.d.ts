import { ConfigPlugin } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';
export declare type IosProps = {
    appleTeamId?: string;
    /**
     * Sets the `com.apple.developer.icloud-container-environment` entitlement which is read by EAS CLI to set
     * the `iCloudContainerEnvironment` in the `xcodebuild` `exportOptionsPlist`.
     *
     * Available options: https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_icloud-container-environment
     */
    iCloudContainerEnvironment?: 'Development' | 'Production';
};
export declare const withDocumentPickerIOS: ConfigPlugin<IosProps>;
export declare function setICloudEntitlements(config: Pick<ExpoConfig, 'ios'>, { appleTeamId, iCloudContainerEnvironment }: IosProps, { 'com.apple.developer.icloud-container-environment': _env, ...entitlements }: Record<string, any>): Record<string, any>;

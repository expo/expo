import { ExpoConfig } from 'expo/config';
import { ConfigPlugin } from 'expo/config-plugins';
export type IosProps = {
    /**
     * Sets the `com.apple.developer.icloud-container-environment` entitlement which is read by EAS CLI to set
     * the `iCloudContainerEnvironment` in the `xcodebuild` `exportOptionsPlist`.
     *
     * Available options: https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_icloud-container-environment
     */
    iCloudContainerEnvironment?: 'Development' | 'Production';
};
export declare const withDocumentPickerIOS: ConfigPlugin<IosProps>;
export declare function setICloudEntitlements(config: Pick<ExpoConfig, 'ios'>, { iCloudContainerEnvironment }: IosProps, { 'com.apple.developer.icloud-container-environment': _env, ...entitlements }: Record<string, any>): Record<string, any>;

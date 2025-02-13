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
    /**
     * By default, the `com.apple.developer.ubiquity-kvstore-identifier` entitlement is set to a concatenation
     * of your Apple Team ID and the bundle identifier. However, this entitlement may need to reflect a previous Team ID if your
     * app was transferred from another team. Use this option to set this entitlement value manually.
     */
    kvStoreIdentifier?: string;
};
export declare const withDocumentPickerIOS: ConfigPlugin<IosProps>;
export declare function setICloudEntitlements(config: Pick<ExpoConfig, 'ios'>, { iCloudContainerEnvironment, kvStoreIdentifier }: IosProps, { 'com.apple.developer.icloud-container-environment': _env, ...entitlements }: Record<string, any>): Record<string, any>;

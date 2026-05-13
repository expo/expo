import { ConfigPlugin } from '@expo/config-plugins';
import { ShareExtensionFiles } from './setupShareExtensionFiles';
type WithShareExtensionXcodeProjectProps = {
    targetName: string;
    bundleIdentifier: string;
    deploymentTarget: string;
    shareExtensionFiles: ShareExtensionFiles;
};
export declare const withShareExtensionXcodeProject: ConfigPlugin<WithShareExtensionXcodeProjectProps>;
export {};

import { ConfigPlugin } from '@expo/config-plugins';
import { ActivationRule } from '../sharingPlugin.types';
import { ShareExtensionFiles } from './setupShareExtensionFiles';
type WithShareExtensionSourceFilesProps = {
    targetName: string;
    appGroupId: string;
    urlScheme: string;
    activationRule: ActivationRule;
    onFilesWritten: (files: ShareExtensionFiles) => void;
};
export declare const withShareExtensionFiles: ConfigPlugin<WithShareExtensionSourceFilesProps>;
export {};

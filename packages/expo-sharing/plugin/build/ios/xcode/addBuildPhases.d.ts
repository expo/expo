import { XcodeProject } from '@expo/config-plugins';
import { ShareExtensionFiles } from '../setupShareExtensionFiles';
export declare function addBuildPhases(xcodeProject: XcodeProject, targetUuid: string, targetName: string, groupName: string, productFile: {
    uuid: string;
    target: string;
    basename: string;
    group: string;
}, shareExtensionFiles: ShareExtensionFiles, platformProjectRoot: string): void;

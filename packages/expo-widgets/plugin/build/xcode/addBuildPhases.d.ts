import { XcodeProject } from 'expo/config-plugins';
export declare function addBuildPhases(xcodeProject: XcodeProject, { targetUuid, groupName, productFile, widgetFiles, }: {
    targetUuid: string;
    groupName: string;
    productFile: {
        uuid: string;
        target: string;
        basename: string;
        group: string;
    };
    widgetFiles: string[];
}): void;

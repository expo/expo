import { XcodeProject } from 'expo/config-plugins';
export declare function addToPbxNativeTargetSection(xcodeProject: XcodeProject, { targetName, targetUuid, productFile, xCConfigurationList, }: {
    targetName: string;
    targetUuid: string;
    productFile: {
        fileRef: string;
    };
    xCConfigurationList: {
        uuid: string;
    };
}): {
    uuid: any;
    pbxNativeTarget: any;
};

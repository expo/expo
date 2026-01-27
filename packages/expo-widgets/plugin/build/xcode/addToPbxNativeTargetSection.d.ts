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
    uuid: string;
    pbxNativeTarget: {
        isa: string;
        name: string;
        productName: string;
        productReference: string;
        productType: string;
        buildConfigurationList: string;
        buildPhases: never[];
        buildRules: never[];
        dependencies: never[];
    };
};

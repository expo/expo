import { XcodeProject } from '@expo/config-plugins';
export declare function addToPbxNativeTargetSection(xcodeProject: XcodeProject, targetName: string, targetUuid: string, productFile: {
    fileRef: string;
}, xcConfigurationList: {
    uuid: string;
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

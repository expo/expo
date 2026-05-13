import { XcodeProject } from '@expo/config-plugins';

export function addToPbxNativeTargetSection(
  xcodeProject: XcodeProject,
  targetName: string,
  targetUuid: string,
  productFile: { fileRef: string },
  xcConfigurationList: { uuid: string }
) {
  const target = {
    uuid: targetUuid,
    pbxNativeTarget: {
      isa: 'PBXNativeTarget',
      name: targetName,
      productName: targetName,
      productReference: productFile.fileRef,
      productType: `"com.apple.product-type.app-extension"`,
      buildConfigurationList: xcConfigurationList.uuid,
      buildPhases: [],
      buildRules: [],
      dependencies: [],
    },
  };

  xcodeProject.addToPbxNativeTargetSection(target);

  return target;
}

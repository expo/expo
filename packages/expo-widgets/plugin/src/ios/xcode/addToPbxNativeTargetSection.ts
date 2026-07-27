import { XcodeProject } from 'expo/config-plugins';

export function addToPbxNativeTargetSection(
  xcodeProject: XcodeProject,
  {
    targetName,
    targetUuid,
    productFile,
    xCConfigurationList,
  }: {
    targetName: string;
    targetUuid: string;
    productFile: { fileRef: string };
    xCConfigurationList: { uuid: string };
  }
) {
  const existingTargetUuid = xcodeProject.findTargetKey(targetName);
  if (existingTargetUuid) {
    return {
      uuid: existingTargetUuid,
      pbxNativeTarget: xcodeProject.pbxNativeTargetSection()[existingTargetUuid],
    };
  }

  const target = {
    uuid: targetUuid,
    pbxNativeTarget: {
      isa: 'PBXNativeTarget',
      name: targetName,
      productName: targetName,
      productReference: productFile.fileRef,
      productType: `"com.apple.product-type.app-extension"`,
      buildConfigurationList: xCConfigurationList.uuid,
      buildPhases: [],
      buildRules: [],
      dependencies: [],
    },
  };

  xcodeProject.addToPbxNativeTargetSection(target);
  return target;
}

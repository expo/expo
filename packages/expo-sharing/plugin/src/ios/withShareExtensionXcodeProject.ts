import { ConfigPlugin, withXcodeProject } from '@expo/config-plugins';
import * as console from 'node:console';

import { conflictingExtensionExists } from './conflictingExtensionExists';
import { ShareExtensionFiles } from './setupShareExtensionFiles';
import { addBuildPhases } from './xcode/addBuildPhases';
import { addPbxGroup } from './xcode/addPbxGroup';
import { addProductFile } from './xcode/addProductFile';
import { addToPbxNativeTargetSection } from './xcode/addToPbxNativeTargetSection';
import { addToPbxProjectSection } from './xcode/addToPbxProjectSection';
import { addXCConfigurationList } from './xcode/addXCConfigurationList';

type WithShareExtensionXcodeProjectProps = {
  targetName: string;
  bundleIdentifier: string;
  deploymentTarget: string;
  shareExtensionFiles: ShareExtensionFiles;
};
export const withShareExtensionXcodeProject: ConfigPlugin<WithShareExtensionXcodeProjectProps> = (
  config,
  { targetName, bundleIdentifier, deploymentTarget, shareExtensionFiles }
) => {
  return withXcodeProject(config, (config) => {
    const groupName = 'Embed Foundation Extensions';
    const xcodeProject = config.modResults;
    const { platformProjectRoot } = config.modRequest;
    const targetUuid = xcodeProject.generateUuid();

    // Technically we should be able to remove the existing target, but I don't have time to add it before the release.
    // Most users will chose not to modify the identifier anyways.
    // TODO: Add smart existing target removal
    const conflict_status = conflictingExtensionExists(xcodeProject, targetName, bundleIdentifier);
    if (conflict_status === 'exists-conflicting') {
      throw new Error(
        `Expo-sharing: An extension with the name ${targetName} already exists in the project, but is registered with a different bundle identifier.` +
          ` The existing extension will not be modified. In order to apply a new bundle identifier run the prebuild command with \`--clean\` flag`
      );
    }
    if (conflict_status === 'exists') {
      console.warn(
        `Expo-sharing: Target with bundleId: ${bundleIdentifier} already exists in the project and will not be added`
      );
      return config;
    }

    const xcConfigurationList = addXCConfigurationList(
      xcodeProject,
      targetName,
      bundleIdentifier,
      deploymentTarget,
      config.ios?.buildNumber ?? '1',
      config.version ?? '1.0'
    );

    const productFile = addProductFile(xcodeProject, targetName, groupName);

    const pbxNativeTargetObject = addToPbxNativeTargetSection(
      xcodeProject,
      targetName,
      targetUuid,
      productFile,
      xcConfigurationList
    );

    addToPbxProjectSection(xcodeProject, pbxNativeTargetObject);

    addBuildPhases(
      xcodeProject,
      targetUuid,
      targetName,
      groupName,
      productFile,
      shareExtensionFiles,
      platformProjectRoot
    );

    addPbxGroup(xcodeProject, targetName, shareExtensionFiles, platformProjectRoot);
    return config;
  });
};

import { ConfigPlugin, withXcodeProject } from 'expo/config-plugins';
import * as path from 'path';

import { addBuildPhases } from './addBuildPhases';
import { addPbxGroup } from './addPbxGroup';
import { addProductFile } from './addProductFile';
import { addTargetDependency } from './addTargetDependency';
import { addToPbxNativeTargetSection } from './addToPbxNativeTargetSection';
import { addToPbxProjectSection } from './addToPbxProjectSection';
import { addXCConfigurationList } from './addXCConfigurationList';

type TargetXcodeProjectProps = {
  targetName: string;
  bundleIdentifier: string;
  deploymentTarget: string;
  appleTeamId?: string;
  getFileUris: () => string[];
};

const withTargetXcodeProject: ConfigPlugin<TargetXcodeProjectProps> = (
  config,
  { targetName, bundleIdentifier, deploymentTarget, appleTeamId, getFileUris }
) =>
  withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;

    // Check if the target already exists to avoid duplicates on repeated prebuilds
    const nativeTargets = xcodeProject.pbxNativeTargetSection();
    const existingTarget = Object.values(nativeTargets).find(
      (target: any) => target.name === targetName
    );
    if (existingTarget) {
      return config;
    }

    const targetUuid = xcodeProject.generateUuid();
    const groupName = 'Embed Foundation Extensions';

    const xCConfigurationList = addXCConfigurationList(xcodeProject, {
      targetName,
      bundleIdentifier,
      deploymentTarget,
      appleTeamId,
      marketingVersion: '1.0',
      currentProjectVersion: '1',
    });

    const productFile = addProductFile(xcodeProject, {
      targetName,
      groupName,
    });

    const target = addToPbxNativeTargetSection(xcodeProject, {
      targetName,
      targetUuid,
      productFile,
      xCConfigurationList,
    });

    addToPbxProjectSection(xcodeProject, target);

    addTargetDependency(xcodeProject, target);

    const projectRoot = config.modRequest.platformProjectRoot;
    const targetDirectory = path.join(projectRoot, targetName);
    const relativePaths = getFileUris().map((file) => path.relative(targetDirectory, file));
    const swiftWidgetFiles = relativePaths.filter((file) => file.endsWith('.swift'));

    addBuildPhases(xcodeProject, {
      targetUuid,
      groupName,
      productFile,
      widgetFiles: swiftWidgetFiles,
    });

    addPbxGroup(xcodeProject, {
      targetName,
      widgetFiles: relativePaths,
    });

    return config;
  });

export default withTargetXcodeProject;

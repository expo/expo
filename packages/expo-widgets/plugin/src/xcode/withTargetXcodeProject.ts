import { ConfigPlugin, withXcodeProject } from 'expo/config-plugins';

import { addBuildPhases } from './addBuildPhases';
import { addPbxGroup } from './addPbxGroup';
import { addProductFile } from './addProductFile';
import { addTargetDependency } from './addTargetDependency';
import { addToPbxNativeTargetSection } from './addToPbxNativeTargetSection';
import { addToPbxProjectSection } from './addToPbxProjectSection';
import { addXCConfigurationList } from './addXCConfigurationList';

interface TargetXcodeProjectProps {
  targetName: string;
  targetBundleIdentifier: string;
  deploymentTarget: string;
  getFileUris: () => string[];
}

const withTargetXcodeProject: ConfigPlugin<TargetXcodeProjectProps> = (
  config,
  { targetName, targetBundleIdentifier, deploymentTarget, getFileUris }
) =>
  withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const targetUuid = xcodeProject.generateUuid();
    const groupName = 'Embed Foundation Extensions';
    const marketingVersion = config.version;

    const xCConfigurationList = addXCConfigurationList(xcodeProject, {
      targetName,
      currentProjectVersion: config.ios!.buildNumber || '1',
      bundleIdentifier: targetBundleIdentifier,
      deploymentTarget,
      marketingVersion,
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

    const swiftWidgetFiles = getFileUris().filter((file) => file.endsWith('.swift'));

    addBuildPhases(xcodeProject, {
      targetUuid,
      groupName,
      productFile,
      widgetFiles: swiftWidgetFiles,
    });

    addPbxGroup(xcodeProject, {
      targetName,
      widgetFiles: getFileUris(),
    });

    return config;
  });

export default withTargetXcodeProject;

import { ConfigPlugin, IOSConfig, withXcodeProject, type XcodeProject } from 'expo/config-plugins';
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

type PbxGroup = {
  children: { value: string; comment?: string }[];
};

function getGroupAtPath(xcodeProject: XcodeProject, groupPath: string): PbxGroup | null {
  const { firstProject } = xcodeProject.getFirstProject();
  let group = xcodeProject.getPBXGroupByKey(firstProject.mainGroup) as PbxGroup | undefined;

  for (const component of groupPath.split('/')) {
    const child = group?.children.find(({ comment }) => comment === component);
    if (!child) {
      return null;
    }
    group = xcodeProject.getPBXGroupByKey(child.value) as PbxGroup | undefined;
  }

  return group ?? null;
}

export function getLocalizableStringsFileRefs(
  xcodeProject: XcodeProject,
  projectName: string,
  languages: string[]
): string[] {
  return languages.flatMap((language) => {
    const localeGroup = getGroupAtPath(xcodeProject, `${projectName}/Supporting/${language}.lproj`);
    const file = localeGroup?.children.find(({ comment }) => comment === 'Localizable.strings');
    return file ? [file.value] : [];
  });
}

const withTargetXcodeProject: ConfigPlugin<TargetXcodeProjectProps> = (
  config,
  { targetName, bundleIdentifier, deploymentTarget, appleTeamId, getFileUris }
) =>
  withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const targetUuid = xcodeProject.generateUuid();
    const groupName = 'Embed Foundation Extensions';
    const marketingVersion = config.ios?.version ?? config.version ?? '1.0';
    const currentProjectVersion = config.ios?.buildNumber ?? '1';

    // TODO(@kitten): This was untyped before and is now failing
    const xCConfigurationList: any = addXCConfigurationList(xcodeProject, {
      targetName,
      bundleIdentifier,
      deploymentTarget,
      appleTeamId,
      marketingVersion,
      currentProjectVersion,
    });
    // TODO(@kitten): This was untyped before and is now failing
    const productFile: any = addProductFile(xcodeProject, {
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
    const projectName = IOSConfig.XcodeUtils.getProjectName(config.modRequest.projectRoot);
    const localizableStringsFileRefs = getLocalizableStringsFileRefs(
      xcodeProject,
      projectName,
      Object.keys(config.locales ?? {})
    );

    addBuildPhases(xcodeProject, {
      targetUuid: target.uuid,
      groupName,
      productFile,
      widgetFiles: swiftWidgetFiles,
      resourceFileRefs: localizableStringsFileRefs,
    });

    addPbxGroup(xcodeProject, {
      targetName,
      widgetFiles: relativePaths,
    });

    return config;
  });

export default withTargetXcodeProject;

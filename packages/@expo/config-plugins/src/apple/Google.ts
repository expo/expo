import { ExpoConfig } from '@expo/config-types';
import plist from '@expo/plist';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { XcodeProject } from 'xcode';

import { InfoPlist } from './AppleConfig.types';
import { getSourceRoot } from './Paths';
import { appendScheme } from './Scheme';
import { addResourceFileToGroup, getProjectName } from './utils/Xcodeproj';
import { ConfigPlugin, ModProps } from '../Plugin.types';
import { withInfoPlist, withXcodeProject } from '../plugins/apple-plugins';

export const withGoogle: (applePlatform: 'ios' | 'macos') => ConfigPlugin =
  (applePlatform: 'ios' | 'macos') => (config) => {
    return withInfoPlist(applePlatform)(config, (config) => {
      config.modResults = setGoogleConfig(applePlatform)(
        config,
        config.modResults,
        config.modRequest
      );
      return config;
    });
  };

export const withGoogleServicesFile: (applePlatform: 'ios' | 'macos') => ConfigPlugin =
  (applePlatform: 'ios' | 'macos') => (config) => {
    return withXcodeProject(applePlatform)(config, (config) => {
      config.modResults = setGoogleServicesFile(applePlatform)(config, {
        projectRoot: config.modRequest.projectRoot,
        project: config.modResults,
      });
      return config;
    });
  };

function readGoogleServicesInfoPlist(
  relativePath: string,
  { projectRoot }: { projectRoot: string }
) {
  const googleServiceFilePath = path.resolve(projectRoot, relativePath);
  const contents = fs.readFileSync(googleServiceFilePath, 'utf8');
  assert(contents, 'GoogleService-Info.plist is empty');
  return plist.parse(contents);
}

export const getGoogleSignInReversedClientId =
  (applePlatform: 'ios' | 'macos') =>
  (
    config: Pick<ExpoConfig, typeof applePlatform>,
    modRequest: Pick<ModProps<InfoPlist>, 'projectRoot'>
  ): string | null => {
    const googleServicesFileRelativePath = getGoogleServicesFile(applePlatform)(config);
    if (googleServicesFileRelativePath === null) {
      return null;
    }

    const infoPlist = readGoogleServicesInfoPlist(googleServicesFileRelativePath, modRequest);

    return infoPlist.REVERSED_CLIENT_ID ?? null;
  };

export const getGoogleServicesFile =
  (applePlatform: 'ios' | 'macos') => (config: Pick<ExpoConfig, typeof applePlatform>) => {
    return config[applePlatform]?.googleServicesFile ?? null;
  };

export const setGoogleSignInReversedClientId =
  (applePlatform: 'ios' | 'macos') =>
  (
    config: Pick<ExpoConfig, typeof applePlatform>,
    infoPlist: InfoPlist,
    modRequest: Pick<ModProps<InfoPlist>, 'projectRoot'>
  ): InfoPlist => {
    const reversedClientId = getGoogleSignInReversedClientId(applePlatform)(config, modRequest);

    if (reversedClientId === null) {
      return infoPlist;
    }

    return appendScheme(reversedClientId, infoPlist);
  };

export const setGoogleConfig =
  (applePlatform: 'ios' | 'macos') =>
  (
    config: Pick<ExpoConfig, typeof applePlatform>,
    infoPlist: InfoPlist,
    modRequest: ModProps<InfoPlist>
  ): InfoPlist => {
    infoPlist = setGoogleSignInReversedClientId(applePlatform)(config, infoPlist, modRequest);
    return infoPlist;
  };

export const setGoogleServicesFile =
  (applePlatform: 'ios' | 'macos') =>
  (
    config: Pick<ExpoConfig, typeof applePlatform>,
    { projectRoot, project }: { project: XcodeProject; projectRoot: string }
  ): XcodeProject => {
    const googleServicesFileRelativePath = getGoogleServicesFile(applePlatform)(config);
    if (googleServicesFileRelativePath === null) {
      return project;
    }

    const googleServiceFilePath = path.resolve(projectRoot, googleServicesFileRelativePath);
    fs.copyFileSync(
      googleServiceFilePath,
      path.join(getSourceRoot(applePlatform)(projectRoot), 'GoogleService-Info.plist')
    );

    const projectName = getProjectName(applePlatform)(projectRoot);
    const plistFilePath = `${projectName}/GoogleService-Info.plist`;
    if (!project.hasFile(plistFilePath)) {
      project = addResourceFileToGroup(applePlatform)({
        filepath: plistFilePath,
        groupName: projectName,
        project,
        isBuildFile: true,
        verbose: true,
      });
    }
    return project;
  };
